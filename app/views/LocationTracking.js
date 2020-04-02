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
} from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import colors from '../constants/colors';
import LocationServices from '../services/LocationService';
import BroadcastingServices from '../services/BroadcastingService';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import exportImage from './../assets/images/export.png';
import news from './../assets/images/newspaper.png';
import kebabIcon from './../assets/images/kebabIcon.png';
import pkLogo from './../assets/images/PKLogo.png';

import { GetStoreData, SetStoreData } from '../helpers/General';
import { ExportLocationData, NearbyPlacesRequest } from '../helpers/ExportData';
import languages from './../locales/languages';

import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const width = Dimensions.get('window').width;
const DELTA = 0.006;

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
        console.log('Cordssdafds: ', position.coords);
        position.coords.latitudeDelta = DELTA;
        position.coords.longitudeDelta = DELTA;

        let heatmapPoints = await NearbyPlacesRequest({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        this.setState({
          location: position.coords,
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

  overlap() {
    this.props.navigation.navigate('OverlapScreen', {});
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
          region={this.state.location}>
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
            </MenuOptions>
          </Menu>
        </View>

        <View style={styles.buttonsContainer}>
          <View style={styles.logButtonsView}>
            {this.state.isLogging ? (
              <>
                <TouchableOpacity
                  onPress={() => this.setOptOut()}
                  style={styles.stopLoggingButtonTouchable}>
                  <Text style={styles.stopLoggingButtonText}>
                    {languages.t('label.stop_logging')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.overlap()}
                  style={styles.checkOverlapButtonTouchable}>
                  <Text style={styles.startLoggingButtonText}>
                    {languages.t('label.overlap')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
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
              onPress={() => this.import()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={styles.actionButtonImage}
                source={exportImage}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>
                {languages.t('label.import')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => ExportLocationData()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={[
                  styles.actionButtonImage,
                  { transform: [{ rotate: '180deg' }] },
                ]}
                source={exportImage}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.news()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={styles.actionButtonImage}
                source={news}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>New Entry</Text>
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
    flex: 3,
    flexDirection: 'column',
    bottom: 30,
    height: '25%',
    width: '100%',
  },
  logButtonsView: {
    flex: 2,
    flexDirection: 'column',
  },
  actionButtonsView: {
    width: '100%',
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 2,
    alignItems: 'center',
    zIndex: 2,
  },
  checkOverlapButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    alignSelf: 'center',
    width: width * 0.7866,
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
  },
  startLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    alignSelf: 'center',
    width: width * 0.7866,
    flex: 0.5,
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
  stopLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#fd4a4a',
    height: 52,
    alignSelf: 'center',
    width: width * 0.7866,
    justifyContent: 'center',
    flex: 1,
    marginBottom: 10,
  },
  stopLoggingButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  },
  actionButtonsTouchable: {
    height: 76,
    borderRadius: 8,
    backgroundColor: '#454f63',
    width: width * 0.23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonImage: {
    height: 21.6,
    width: 32.2,
  },
  actionButtonText: {
    opacity: 0.56,
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
    marginTop: 6,
  },
  menuOptionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    padding: 10,
  },
});

export default LocationTracking;
