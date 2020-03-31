import database from '@react-native-firebase/database';
import { GetStoreData, SetStoreData } from './General';

const GEOCODE_API_KEY = 'AIzaSyD4haU0TxYfEBWvNd5DBM5HtTQe3J5nJGU';

/* Call this function when the survey deems the user is unhealthy and we can update risk
scores for their location history */
export async function ExportLocationData() {
  try {
    const locationArray = await GetStoreData('LOCATION_DATA');

    if (locationArray === null) {
      return;
    }

    locationData = JSON.parse(locationArray);
    console.log('Exporting location history: ', locationData);

    // Max 20 requests right now to prevent spending money on too many unwanted requests
    fetchLoop: for (let i = 0; i < Math.min(20, locationData.length); i++) {
      fetch(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
          locationData[i].latitude +
          ',' +
          locationData[i].longitude +
          '&key=' +
          GEOCODE_API_KEY,
      )
        .then(response => response.json())
        .then(async responseJson => {
          const locationDetails = responseJson.results[0];

          // Make sure this location isn't a neighborhood - we don't want to track people's homes
          if (locationDetails.types.indexOf('neighborhood') === -1) {
            const placeID = locationDetails.placeID;

            // Update risk score in Firebase for this place ID
            const ref = database().ref(`/${placeID}`);
            const snapshot = await ref.once('value');
            console.log('Snapshot: ', snapshot.val());
          }

          //End .then execution
        });
    }
  } catch (error) {
    console.log(error);
  }
}
