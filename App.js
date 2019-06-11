import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'native-base';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import Recorder from './components/Recorder';
import VoiceAssistent from './components/VoiceAssistent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    color: 'green',
    margin: 10,
  },
  button: {
    alignSelf: 'center',
    marginTop: 20,
  },
});

const HomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.welcome}>Welcome to React Native!</Text>
    <VoiceAssistent />
    <Text style={styles.instructions}>To get started, press Speak</Text>
    <Button
      style={styles.button}
      bordered
      onPress={() => navigation.navigate('Record')}
    >
      <Text>Go to recorder</Text>
    </Button>
  </View>
);

HomeScreen.propTypes = {
  navigation: PropTypes.instanceOf(Object).isRequired,
};

const AppNavigator = createStackNavigator({
  Home: {
    screen: HomeScreen,
  },
  Record: {
    screen: Recorder,
  },
});

const AppContainer = createAppContainer(AppNavigator);

const App = () => {
  return <AppContainer />;
};

export default App;
