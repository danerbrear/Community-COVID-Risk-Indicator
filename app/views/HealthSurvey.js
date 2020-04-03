import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Image,
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Dimensions,
} from 'react-native';

import colors from '../constants/colors';
import backArrow from './../assets/images/backArrow.png';
import survey from '../constants/survey';
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

class NewsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      surveyPage: 0,
    };
  }

  backToMain() {
    if (this.state.surveyPage === 0) {
      this.props.navigation.navigate('LocationTrackingScreen', {});
    } else {
      this.setState({
        surveyPage: this.state.surveyPage - 1,
      });
    }
    return true;
  }

  handleBackPress = () => {
    if (this.state.surveyPage === 0) {
      this.props.navigation.navigate('LocationTrackingScreen', {});
    } else {
      this.setState({
        surveyPage: this.state.surveyPage - 1,
      });
    }
    return true;
  };

  next() {
    this.setState({
      surveyPage: this.state.surveyPage + 1,
    });
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  render() {
    const buttons = survey[this.state.surveyPage].buttonOptions.map(btn => (
      <TouchableOpacity
        style={btn === 'No' ? styles.negativeButton : styles.positiveButton}
        onPress={btn !== 'No' ? () => this.next() : () => this.backToMain()}>
        <Text style={styles.buttonText}>{btn}</Text>
      </TouchableOpacity>
    ));

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backArrowTouchable}
            onPress={() => this.backToMain()}>
            <Image style={styles.backArrow} source={backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Survey</Text>
        </View>
        <View style={styles.bodyContainer}>
          <Text style={styles.title}>
            {survey[this.state.surveyPage].title}
          </Text>
          <Text style={styles.bodyText}>
            {survey[this.state.surveyPage].bodyText}
          </Text>
          {buttons}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  // Container covers the entire screen
  container: {
    flex: 1,
    flexDirection: 'column',
    color: colors.PRIMARY_TEXT,
    backgroundColor: colors.WHITE,
  },
  headerContainer: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(189, 195, 199,0.6)',
    alignItems: 'center',
  },
  backArrowTouchable: {
    width: 60,
    height: 60,
    paddingTop: 21,
    paddingLeft: 20,
  },
  backArrow: {
    height: 18,
    width: 18.48,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'OpenSans-Bold',
  },
  bodyContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 30,
    textAlign: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  bodyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  negativeButton: {
    borderRadius: 12,
    backgroundColor: 'red',
    alignSelf: 'center',
    width: '60%',
    height: 50,
    justifyContent: 'center',
    marginTop: 30,
  },
  positiveButton: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    alignSelf: 'center',
    width: '60%',
    height: 50,
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
  },
});

export default NewsScreen;
