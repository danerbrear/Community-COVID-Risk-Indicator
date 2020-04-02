import database from '@react-native-firebase/database';
import { GetStoreData, SetStoreData } from './General';

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
    console.log('Exporting location history: ', locationData);

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
          console.log('JSON Response: ', responseJson);
          if (responseJson.status === 'OK') {
            const locationDetails = responseJson.results[0];

            // Make sure this location isn't a neighborhood - we don't want to track people's homes
            if (locationDetails.types.indexOf('neighborhood') === -1) {
              const placeID = locationDetails.place_id;

              // Update risk score in Firebase for this place ID
              const ref = database().ref(`/${placeID}`);
              const snapshot = await ref.once('value');

              // Increment that places count of infected people
              if (snapshot.val() === null) {
                await ref.set({ count: 1 });
              } else {
                await ref.set({ count: snapshot.val().count + 1 });
              }
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
    radius: '30',
    types: [
      'restaurant',
      'airport',
      'amusement_park',
      'aquarium',
      'art_gallery',
      'bank',
      'bakery',
      // 'bar',
    ],
  };

  let result = [];

  await fetch(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' +
      location.latitude +
      ',' +
      location.longitude +
      '&radius=' +
      request.radius +
      '&types=' +
      request.types.toString() +
      '&key=' +
      API_KEY,
  )
    .then(response => response.json())
    .then(async response => {
      // Format places into an object to be returned
      let promises = response.results.map(async place => {
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
      result = places;
    });
  return result;
}
