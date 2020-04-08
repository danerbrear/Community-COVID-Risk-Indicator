import React, { Component } from 'react';
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

import { GetStoreData, SetStoreData } from '../helpers/General';
import { ExportLocationData, NearbyPlacesRequest } from '../helpers/ExportData';
import languages from './../locales/languages';

import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const width = Dimensions.get('window').width;
const DELTA = 0.004;

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
      },
      heatmapPoints: [],
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

  findCoordinates = async () => {
    await Geolocation.getCurrentPosition(
      async position => {
        position.coords.latitudeDelta = DELTA;
        position.coords.longitudeDelta = DELTA;

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
  export() {
    this.props.navigation.navigate('ExportScreen', {});
  }

  import() {
    this.props.navigation.navigate('ImportScreen', {});
  }

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

  news() {
    this.props.navigation.navigate('NewsScreen', {});
  }

  licenses() {
    this.props.navigation.navigate('LicensesScreen', {});
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
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapView}
          region={this.state.location}
          showsUserLocation={true}>
          <MapView.Heatmap
            points={this.state.heatmapPoints}
            dissipating={false}
            opacity={1}
            radius={50}
            gradientSmoothing={10}
            heatmapMode={'POINTS_DENSITY'}
          />
        </MapView>
        {/*Modal just for licenses*/}
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
          <View style={styles.actionButtonsView}>
            <TouchableOpacity
              onPress={() => this.news()}
              style={styles.actionButtonsTouchable}>
              <Icon name='injection-syringe' color='white' size={40} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
  },
  headerContainer: {
    flexDirection: 'row',
    top: 0,
    zIndex: 2,
    position: 'absolute',
  },
  headerTitle: {
    flex: 7,
    textAlign: 'center',
    fontSize: 38,
    padding: 0,
    fontFamily: 'OpenSans-Bold',
    justifyContent: 'flex-start',
  },
  subHeaderTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    padding: 5,
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
    paddingHorizontal: 12,
  },
  actionButtonsView: {
    width: '100%',
    paddingRight: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  startLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    alignSelf: 'center',
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    zIndex: 2,
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
  },
  actionButtonImage: {
    height: 21.6,
    width: 32.2,
  },
  menuOptionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    padding: 10,
  },
});

export default LocationTracking;
