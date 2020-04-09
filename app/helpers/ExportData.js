import database from '@react-native-firebase/database';
import { GetStoreData, SetStoreData } from './General';
import place_types from '../constants/place_types';
import { API_KEY } from '../../env';

/* Call this function when the survey deems the user is unhealthy and we can update risk
scores for their location history */
export async function ExportLocationData() {
  console.log('Exporting locations...');
  try {
    let locationArray = await GetStoreData('LOCATION_DATA');

    if (locationArray === null) {
      console.log('No location history.');
      return;
    }

    locationData = JSON.parse(locationArray);

    // Only use last two weeks of location data
    let two_weeks_ago = new Date();
    two_weeks_ago.setDate(two_weeks_ago.getDate() - 14);
    locationData = locationData.filter(function(e) {
      return two_weeks_ago < new Date(e.time);
    });

    // Max 200 requests right now to prevent spending money on too many unwanted requests
    for (let i = 0; i < Math.min(200, locationData.length); i++) {
      console.log(i);
      const res = await fetch(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
          locationData[i].latitude +
          ',' +
          locationData[i].longitude +
          '&key=' +
          API_KEY,
      );
      const responseJson = await res.json();
      if (responseJson.status === 'OK') {
        const locationDetails = responseJson.results[0];

        // Filter out types of places that aren't public
        let intersectionExists = false;
        let a = place_types,
          b = locationDetails.types,
          t;
        if (b.length > a.length) (t = b), (b = a), (a = t); // indexOf to loop over shorter
        a.filter(function(e) {
          intersectionExists = b.indexOf(e) === -1 ? intersectionExists : true;
        });
        // Double check to make sure no neighborhoods
        intersectionExists =
          locationDetails.types.indexOf('neighborhood') === -1
            ? intersectionExists
            : false;
        console.log('Location Types: ', locationDetails.types);
        console.log('Intersected: ', intersectionExists);
        if (!intersectionExists) {
          continue;
        }

        const placeID = locationDetails.place_id;

        // Update risk score in Firebase for this place ID
        const ref = database().ref(`/${placeID}`);
        console.log('Ref: ', ref);
        const response = await ref.push({
          timestamp: new Date().toISOString(),
        });
        console.log(response);
      } else {
        console.error('Google Request Error.');
      }
    }
  } catch (error) {
    console.log(error);
  }
  console.log('Finished exporting.');
}

export async function NearbyPlacesRequest(location = null) {
  if (location === null) {
    return;
  }

  const request = {
    key: API_KEY,
    location: location,
    radius: '150',
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
  // Makes the request different so avoids a cached response from google
  let request_count = 0;
  while (next_page_token !== undefined) {
    /*
    Wait for page token to become valid - NOTE: Works most of the time, however for latency issues
     out of our control there are occasions where we receive an INVALID REQUEST
    */
    let status, responseJson2;
    let now = new Date();
    do {
      await new Promise(resolve => {
        setTimeout(resolve, 100);
      });

      const response2 = await fetch(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
          'key=' +
          API_KEY +
          '&pagetoken=' +
          next_page_token +
          '&request_count=' +
          request_count,
      );
      responseJson2 = await response2.json();
      status = responseJson2.status;
      if (new Date() - now > 10000) {
        console.log('[ERROR] Timeout waiting for valid next page token.');
        break;
      }
      request_count++;
    } while (status === 'INVALID_REQUEST');

    // Prevent appending anything in case of error
    if (status === 'OK') {
      // Append new results to aggregate result list
      results = results.concat(responseJson2.results);
    }

    next_page_token = responseJson2.next_page_token;
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
      // Filter out timestamps longer than 2 weeks ago
      let weight = 0;
      Object.keys(snapshot.val()).forEach(key => {
        const date = new Date(snapshot.val()[key].timestamp);
        weight = date < new Date().now - 12096e5 ? weight : weight + 1;
      });

      return {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        weight: weight,
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

  console.log('Number of Infected nearby locations: ', places.length);
  return places;
};
