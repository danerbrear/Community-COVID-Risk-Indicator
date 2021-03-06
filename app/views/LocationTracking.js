import React, { Component, Fragment } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Linking,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import LocationServices from '../services/LocationService';
import BroadcastingServices from '../services/BroadcastingService';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import exportImage from './../assets/images/export.png';
import news from './../assets/images/newspaper.png';
import kebabIcon from './../assets/images/kebabIcon.png';
import Icon from 'react-native-vector-icons/Fontisto';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

import { GetStoreData, SetStoreData } from '../helpers/General';
import { GetPlaceData, NearbyPlacesRequest } from '../helpers/ExportData';
import languages from './../locales/languages';

import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const width = Dimensions.get('window').width;
const DELTA = 0.002;

class LocationTracking extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLogging: '',
      // Default location is Apple HQ
      location: {
        latitude: 37.33182,
        longitude: -122.03118,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
        place_id: null,
      },
      markerDescription: 'Testtesttest',
      heatmapPoints: [],
      showSearch: false,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    GetStoreData('PARTICIPATE')
      .then(isParticipating => {
        console.log('LocationTracking.js: Is participating: ', isParticipating);

        if (isParticipating === 'true') {
          this.setState({
            isLogging: true,
          });
          this.willParticipate();
        } else {
          this.setState({
            isLogging: false,
          });
        }
      })
      .catch(error => console.log(error));
    this.findCoordinates();
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  setRegion = async (lat, lng, place_id) => {
    this.setState({ showSearch: false });

    const countExposed = await GetPlaceData(place_id);

    this.setState({
      location: {
        latitude: lat,
        longitude: lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
        place_id: place_id,
      },
      markerDescription: `${countExposed} infected people here in last 14 days`,
    });
  };

  findCoordinates = async () => {
    console.log('Focusing map on current location.');
    await Geolocation.getCurrentPosition(
      async position => {
        position.coords.latitudeDelta = DELTA;
        position.coords.longitudeDelta = DELTA;
        position.coords.place_id = null; // To tell map that we are not at a searched location

        this.setState({
          location: position.coords,
        });

        let heatmapPoints = await NearbyPlacesRequest({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        console.log('Got heatmap points.');

        // Separate setState call because previous function can take a while and we want the current location ASAP
        this.setState({
          heatmapPoints: heatmapPoints,
        });
      },
      error => Alert.alert(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  };

  handleBackPress = () => {
    BackHandler.exitApp(); // works best when the goBack is async
    return true;
  };

  willParticipate = () => {
    SetStoreData('PARTICIPATE', 'true').then(() => {
      LocationServices.start();
      BroadcastingServices.start();
    });

    // Check and see if they actually authorized in the system dialog.
    // If not, stop services and set the state to !isLogging
    // Fixes tripleblindmarket/private-kit#129
    BackgroundGeolocation.checkStatus(({ authorization }) => {
      if (authorization === BackgroundGeolocation.AUTHORIZED) {
        this.setState({
          isLogging: true,
        });
      } else if (authorization === BackgroundGeolocation.NOT_AUTHORIZED) {
        LocationServices.stop(this.props.navigation);
        BroadcastingServices.stop(this.props.navigation);
        this.setState({
          isLogging: false,
        });
      }
    });
  };

  licenses() {
    this.props.navigation.navigate('LicensesScreen', {});
  }

  healthSurvey() {
    this.props.navigation.navigate('HealthSurvey', {});
  }

  info() {
    Alert.alert(
      'Info',
      'This app is designed to help your neighbors. Trust your community to log their location so you can see what places they have infected if they become sick, and make sure to return the favor. Your location will stay anonymous even when you submit your location history.',
      [{ text: 'Okay' }],
      { cancelable: true },
    );
  }

  confirmStopLog = () => {
    Alert.alert(
      'Stop Logging Location?',
      'If you get sick, this info will be extremely helpful to others using the app. Your location does not leave your phone if you are not sick',
      [
        {
          text: 'Yes',
          onPress: () => {
            this.setOptOut();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  willParticipate = () => {
    SetStoreData('PARTICIPATE', 'true').then(() => {
      LocationServices.start();
      BroadcastingServices.start();
      console.log('Initial Region: ', this.state.initialRegion);
    });
    this.setState({
      isLogging: true,
    });
  };

  setOptOut = () => {
    LocationServices.stop(this.props.navigation);
    BroadcastingServices.stop(this.props.navigation);
    this.setState({
      isLogging: false,
    });
  };

  render() {
    return (
      <Fragment>
        <SafeAreaView styles={{ flex: 0, backgroundColor: 'white' }} />
        <SafeAreaView style={styles.container}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>
                {languages.t('label.private_kit')}
              </Text>
              <Menu
                style={{
                  alignSelf: 'center',
                  paddingTop: 8,
                  zIndex: 2,
                  flex: 1,
                  alignContent: 'center',
                }}>
                <MenuTrigger style={{ justifyContent: 'center' }}>
                  <Image
                    source={kebabIcon}
                    style={{
                      width: 15,
                      height: 28,
                      padding: 14,
                    }}
                  />
                </MenuTrigger>
                <MenuOptions>
                  <MenuOption
                    onSelect={() => {
                      this.licenses();
                    }}>
                    <Text style={styles.menuOptionText}>Licenses</Text>
                  </MenuOption>
                  {this.state.isLogging && (
                    <MenuOption onSelect={this.confirmStopLog}>
                      <Text style={styles.menuOptionText}>
                        Stop Logging Location History
                      </Text>
                    </MenuOption>
                  )}
                </MenuOptions>
              </Menu>
            </View>

            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapView}
              region={this.state.location}
              showsUserLocation={true}>
              <MapView.Heatmap
                points={this.state.heatmapPoints}
                dissipating={false}
                opacity={1}
                radius={90}
                gradientSmoothing={10}
                heatmapMode={'POINTS_DENSITY'}
              />
              {this.state.location.place_id && [
                <MapView.Marker
                  key='1'
                  coordinate={{
                    latitude: this.state.location.latitude,
                    longitude: this.state.location.longitude,
                  }}></MapView.Marker>,
                <MapView.Marker
                  key='2'
                  coordinate={{
                    latitude: this.state.location.latitude + 0.0002,
                    longitude: this.state.location.longitude,
                  }}>
                  <View style={styles.markerDescriptionContainer}>
                    <Text style={styles.markerDescription}>
                      {this.state.markerDescription}
                    </Text>
                  </View>
                </MapView.Marker>,
              ]}
            </MapView>

            <View style={styles.secondaryButtonView}>
              <TouchableOpacity
                onPress={() => {
                  this.setState({ showSearch: !this.state.showSearch });
                }}
                style={styles.secondaryTouchable}>
                <Icon
                  name={this.state.showSearch ? 'close' : 'search'}
                  color='black'
                  size={20}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => this.info()}
                style={styles.secondaryTouchable}>
                <Icon name='info' color='black' size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.findCoordinates}
                style={styles.secondaryTouchable}>
                <Icon name='crosshairs' color='black' size={20} />
              </TouchableOpacity>
            </View>

            {this.state.showSearch && (
              <View style={styles.autocompleteContainer}>
                <PlacesAutocomplete setRegion={this.setRegion} />
              </View>
            )}

            <View style={styles.buttonsContainer}>
              <View style={styles.logButtonsView}>
                {!this.state.isLogging && (
                  <>
                    <TouchableOpacity
                      onPress={() => this.willParticipate()}
                      style={styles.startLoggingButtonTouchable}>
                      <Text style={styles.startLoggingButtonText}>
                        {languages.t('label.start_logging')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Action buttons */}
              {!this.state.showSearch && (
                <View style={styles.actionButtonsView}>
                  <TouchableOpacity
                    onPress={() => this.healthSurvey()}
                    style={styles.actionButtonsTouchable}>
                    <Icon name='injection-syringe' color='white' size={40} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  // Container covers the entire screen
  container: {
    flex: 1,
  },
  mapView: {
    flex: 1,
    backgroundColor: '#665eff',
  },
  headerContainer: {
    flexDirection: 'row',
    zIndex: 2,
    backgroundColor: 'white',
    borderBottomColor: 'gray',
    borderBottomWidth: 10,
  },
  headerTitle: {
    flex: 7,
    justifyContent: 'flex-start',
    fontSize: 38,
    padding: 0,
    fontFamily: 'OpenSans-Bold',
    justifyContent: 'flex-start',
    color: '#665eff',
    marginLeft: 25,
  },
  subHeaderTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    padding: 5,
  },
  autocompleteContainer: {
    flex: 2,
  },
  searchButton: {
    position: 'absolute',
  },
  buttonsContainer: {
    position: 'absolute',
    flex: 1,
    flexDirection: 'row',
    bottom: 30,
    height: 70,
    width: '100%',
  },
  logButtonsView: {
    flex: 4,
    flexDirection: 'column',
    paddingHorizontal: 16,
  },
  actionButtonsView: {
    width: '100%',
    paddingRight: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  startLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    alignSelf: 'center',
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  startLoggingButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  },
  actionButtonsTouchable: {
    height: 76,
    borderRadius: 45,
    backgroundColor: 'red',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 5, height: 3 },
    shadowColor: 'gray',
    shadowOpacity: 0.7,
  },
  actionButtonImage: {
    height: 21.6,
    width: 32.2,
  },
  secondaryButtonView: {
    position: 'absolute',
    justifyContent: 'space-between',
    right: 0,
    top: 50,
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 20,
  },
  secondaryTouchable: {
    backgroundColor: '#d6d6d6',
    borderRadius: 25,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowOffset: { width: 5, height: 3 },
    shadowColor: 'gray',
    shadowOpacity: 0.7,
    marginTop: 20,
  },
  menuOptionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    padding: 10,
  },
  markerDescriptionContainer: {
    backgroundColor: '#d6d6d6',
    flex: 1,
    padding: 8,
    height: 40,
    zIndex: 3,
    justifyContent: 'center',
    borderRadius: 25,
  },
  markerDescription: {},
});

export default LocationTracking;
