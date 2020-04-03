import database from '@react-native-firebase/database';
import { GetStoreData, SetStoreData } from './General';
import place_types from '../constants/place_types';

const API_KEY = 'AIzaSyD4haU0TxYfEBWvNd5DBM5HtTQe3J5nJGU';

/* Call this function when the survey deems the user is unhealthy and we can update risk
scores for their location history */
export async function ExportLocationData() {
  try {
    let locationArray = await GetStoreData('LOCATION_DATA');

    if (locationArray === null) {
      console.log('No location history.');
      return;
    }

    locationData = JSON.parse(locationArray);

    // Max 20 requests right now to prevent spending money on too many unwanted requests
    for (let i = 0; i < Math.min(20, locationData.length); i++) {
      fetch(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
          locationData[i].latitude +
          ',' +
          locationData[i].longitude +
          '&key=' +
          API_KEY,
      )
        .then(response => response.json())
        .then(async responseJson => {
          if (responseJson.status === 'OK') {
            const locationDetails = responseJson.results[0];

            // Filter out types of places that aren't public
            let intersectionExists = false;
            let a = place_types,
              b = locationDetails.types,
              t;
            if (b.length > a.length) (t = b), (b = a), (a = t); // indexOf to loop over shorter
            a.filter(function(e) {
              intersectionExists =
                b.indexOf(e) === -1 ? intersectionExists : true;
            });
            console.log('Location Types: ', locationDetails.types);
            console.log('Intersected: ', intersectionExists);
            if (!intersectionExists) {
              return;
            }

            const placeID = locationDetails.place_id;

            // Update risk score in Firebase for this place ID
            const ref = database().ref(`/${placeID}`);
            const snapshot = await ref.once('value');

            // Increment that places count of infected people
            if (snapshot.val() === null) {
              console.log(
                'Exporting new infected place: ',
                locationDetails.address_components,
              );
              await ref.set({ count: 1 });
            } else {
              console.log('Adding to count of exisiting infected place.');
              await ref.set({ count: snapshot.val().count + 1 });
            }
          } else {
            console.error('Google Request Error.');
          }

          //End .then execution
        });
    }
  } catch (error) {
    console.log(error);
  }
}

export async function NearbyPlacesRequest(location = null) {
  if (location === null) {
    return;
  }

  const request = {
    key: API_KEY,
    location: location,
    radius: '400',
  };

  let result = [];

  const response = await fetch(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' +
      location.latitude +
      ',' +
      location.longitude +
      '&radius=' +
      request.radius +
      '&types=' +
      place_types.toString() +
      '&key=' +
      API_KEY,
  );
  const responseJson = await response.json();

  let results = responseJson.results;

  // If more than 20 results, append next 20 results to current list
  let next_page_token = responseJson.next_page_token;
  // Count is a safety measure
  let count = 0;
  while (next_page_token !== undefined && count < 3) {
    /*
    Wait for page token to become valid - NOTE: Works most of the time, however for latency issues
     out of our control there are occasions where we receive an INVALID REQUEST
    */
    await new Promise(resolve => {
      setTimeout(resolve, 100);
    });

    const response2 = await fetch(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
        'key=' +
        API_KEY +
        '&pagetoken=' +
        next_page_token,
    );
    const responseJson2 = await response2.json();

    console.log(responseJson2.status);

    // Prevent appending anything in case of error
    if (responseJson2.status === 'OK') {
      // Append new results to aggregate result list
      results = results.concat(responseJson2.results);
    }

    next_page_token = responseJson2.next_page_token;
    count++;
  }

  console.log('Number of results: ', results.length);

  result = await this.mapData(results);
  return result;
}

// Helper function that reads from firebase and then filters data to get an array of nearby infected locations
mapData = async results => {
  // Format places into an object to be returned
  let promises = results.map(async place => {
    // console.log(place.place_id)
    // Make firebase reference
    const ref = database().ref(`/${place.place_id}`);
    // Read data for this place
    const snapshot = await ref.once('value');
    if (snapshot.val() !== null) {
      return {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        weight: snapshot.val().count,
      };
    } else {
      return {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        weight: null,
      };
    }
  });

  let placesData = await Promise.all(promises);
  const places = placesData.filter(x => x.weight !== null);

  console.log('Infected nearby locations: ', places);
  return places;
};
