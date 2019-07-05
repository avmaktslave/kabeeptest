import React from 'react';
import {
  // AppRegistry,
  StyleSheet,
  Text,
  ScrollView,
  View,
} from 'react-native';
import { Button } from 'native-base';
import AsyncStorage from '@react-native-community/async-storage';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/dist/FontAwesome';
import Sound from 'react-native-sound';

// import Sound from 'react-native-sound';
import { getUsersKabeeps, loadAudioFromAWS } from '../utils/RecordUploader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCDCDC',
  },
  title: {
    textAlign: 'center',
    margin: 20,
  },
  button: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginBottom: 20,
    padding: 10,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    marginBottom: 3,
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberOfKabeep: {
    borderRightWidth: 1,
    borderRightColor: '#C0C0C0',
    margin: 5,
    padding: 5,
  },
});

export default class KabeepsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      nowPlaying: false,
      kabeepsList: [],
    };
  }

  async componentDidMount() {
    const { navigation } = this.props;
    const token = await AsyncStorage.getItem('user')
      .then(value => {
        const user = JSON.parse(value);
        if (!(user && user.email)) {
          navigation.navigate('Login');
        } else {
          const { token } = user;
          return token;
        }
      })
      .catch(err => {
        console.log('Home component', err);
      });
    const kabeeps = await getUsersKabeeps(token);
    await this.setState({
      kabeepsList: kabeeps.data,
    });
  }

  playKabeepFromAws = async (key, id) => {
    this.setState({
      nowPlaying: id,
    });
    const token = await AsyncStorage.getItem('user')
      .then(value => {
        const user = JSON.parse(value);
        const { token } = user;
        return token;
      })
      .catch(err => {
        console.log('KabeepList', err);
      });
    const audioLinkFromAWS = await loadAudioFromAWS(token, key);
    const sound = await new Sound(
      audioLinkFromAWS,
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('failed to load the sound', error);
        } else {
          sound.play(() => {
            return this.setState({
              nowPlaying: false,
            });
          });
        }
      },
    );
  };

  renderItem = (item, id) => {
    const { nowPlaying } = this.state;
    return (
      <View style={styles.item} key={item.id}>
        <View style={styles.numberOfKabeep}>
          <Text>{item.id}</Text>
        </View>
        <View style={styles.listItem}>
          <View>
            <Text>{item.tags}</Text>
            <Text>{item.holiday}</Text>
            <Text>{item.createdAt}</Text>
          </View>
          <View>
            <Button
              style={styles.button}
              disabled={nowPlaying !== false}
              onPress={() => {
                this.playKabeepFromAws(item.key, id);
              }}
            >
              <Icon
                style={styles.inputIcon}
                name={nowPlaying === id ? 'volume-up' : 'play'}
              ></Icon>
            </Button>
          </View>
        </View>
      </View>
    );
  };

  render() {
    const { isLoading, kabeepsList } = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>List of your kabeeps</Text>
        <ScrollView extraData={this.state}>
          {kabeepsList.map((kabeep, id) => {
            return this.renderItem(kabeep, id);
          })}
        </ScrollView>
      </View>
    );
  }
}

KabeepsList.propTypes = {
  navigation: PropTypes.instanceOf(Object).isRequired,
};
