import React from 'React';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'native-base';
import Icon from 'react-native-vector-icons/dist/FontAwesome';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-community/async-storage';

import VoiceAssistent from './VoiceAssistent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
  },
  welcome: {
    fontSize: 30,
    textAlign: 'center',
    color: '#A9A9A9',
    margin: 10,
  },
  button: {
    alignSelf: 'center',
    marginTop: 20,
  },
});

// eslint-disable-next-line react/prefer-stateless-function
export default class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      headerTitle: (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Icon.Button name="user" backgroundColor="#DCDCDC">
            <Text
              style={{ fontFamily: 'Arial', fontSize: 15, color: '#696969' }}
            >
              Home Page
            </Text>
          </Icon.Button>
          <Button
            style={{ backgroundColor: '#DCDCDC' }}
            onPress={navigation.getParam('logOut')}
            title="Log Out"
            accessibilityLabel="Log Out"
          >
            <Text>Log Out</Text>
          </Button>
        </View>
      ),
      headerStyle: { backgroundColor: '#DCDCDC' },
    };
  };

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setParams({ logOut: this._logOut });
    AsyncStorage.getItem('user')
      .then(value => {
        const user = JSON.parse(value);

        if (!(user && user.email)) {
          navigation.navigate('Login');
        }
      })
      .catch(err => {
        console.log('Home component', err);
      });
  }

  _logOut = () => {
    const { navigation } = this.props;
    AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  render() {
    const { navigation } = this.props;
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Kabeep!</Text>
        <VoiceAssistent />
        <Text style={styles.instructions}>To get started, press Speak</Text>
        <Button
          style={styles.button}
          bordered
          onPress={() => navigation.navigate('KabeepsList')}
        >
          <Text>Your kabeeps List</Text>
        </Button>
      </View>
    );
  }
}

HomeScreen.propTypes = {
  navigation: PropTypes.instanceOf(Object).isRequired,
};
