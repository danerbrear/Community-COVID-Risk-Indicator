import React, { Component } from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { API_KEY } from '../../env';

class PlacesAutocomplete extends Component {
  constructor(props) {
    super(props);
  }

  setLocation(place, details = null) {
    console.log('Setting location on map.');
    if (!details) {
      console.log('Null place details.');
      return;
    }
    this.props.setRegion(
      details.geometry.location.lat,
      details.geometry.location.lng,
      place.place_id,
    );
  }

  render() {
    return (
      <GooglePlacesAutocomplete
        placeholder='Search a location'
        minLength={2}
        autoFocus={false}
        returnKeyType={'search'}
        renderDescription={row => row.description}
        fetchDetails={true}
        styles={{
          textInputContainer: {
            backgroundColor: 'rgba(0,0,0,0)',
            borderTopWidth: 0,
            borderBottomWidth: 0,
          },
          textInput: {
            marginLeft: 0,
            marginRight: 0,
            height: 38,
            color: '#5d5d5d',
            fontSize: 16,
          },
          predefinedPlacesDescription: {
            color: '#1faadb',
          },
        }}
        currentLocation={false}
        query={{
          // available options: https://developers.google.com/places/web-service/autocomplete
          key: API_KEY,
          language: 'en', // language of the results
          types: 'establishment',
        }}
        onPress={(place, details) => this.setLocation(place, details)}
      />
    );
  }
}

export default PlacesAutocomplete;
