# COVID Community Risk Indicator

The COVID Community Risk Indicator is a map that shows hotspots around your current location, indicating that someone who has become ill has been there in the last 14 days. You can also search specific locations to see if they have been exposed.

If you fall ill, there is a button to report that you suspect you have contracted COVID-19, which will then ask you to anonymously submit your location logs for the last 14 days. The logs taken will be used to update the hotspots shown on the app.

The app's priority is data anonymity. Any location logs that are taken, if you are asked to share, will always be completely anonymous. Additionally, no neighborhoods will show hotspots as to retain the privacy of any infected users.

COVID Community Risk Indicator's location logging system and app template is from the open-source project, [Private Kit](https://github.com/tripleblindmarket/covid-safe-paths)

## Video Walkthrough

[COVID Community Risk Indicator Video Walkthrough](https://www.youtube.com/watch?v=ubNMzEFYRUk)

# Development Overview

This is a React Native app version 61.5

## Developer Setup

If you don't have react-native-cli set up yet, run `npm install –g react-native-cli`

Refer to and run the dev_setup.sh for needed tools.

### iOS Configuration - First Time Setup

1. If you don't already have cocoapods, run `sudo gem install cocoapods`
2. Move to `ios` directory and run `pod install`
3. If you have any trouble with packages not round, try `react-native link` from project directory.
4. Look at running commands below.

## Running

Install modules:
```npm install``` or ```yarn install``` (note ```yarn``` does a better job at installing dependencies on macOS)

To run, do:
```
npx react-native run-android
```
or
```
npx react-native run-ios --simulator="iPhone 8 Plus"
```
