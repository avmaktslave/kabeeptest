import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Button, Text } from 'native-base';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  transcript: {
    textAlign: 'center',
    color: '#B0171F',
    marginBottom: 1,
    top: '400%',
  },
});

const getDialogFlow = async msg => {
  const ACCESS_TOKEN = 'd49983307f8041f9bff7539d73c6cd35';
  try {
    const response = await fetch(
      'https://api.dialogflow.com/v1/query?v=20170712',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          query: msg,
          lang: 'EN',
          sessionId: 'somerandomthing',
        }),
      },
    );
    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error(error);
  }
};

export default class VoiceAssistent extends React.Component {
  constructor(props) {
    super(props);
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    this.path = Platform.select({
      ios: 'hello.m4a',
      android: 'sdcard/hello.mp4', // should give extra dir name in android. Won't grant permission to the first level of dir.
    });
  }

  componentDidMount() {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
      Tts.speak("Welcom to Kabeep service, I'm glad to see you"); // eslint-disable-line
    });
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  onSpeechError = e => {
    clearTimeout(this.time);
    if (e.error.message.includes('7')) {
      Tts.speak("sorry but i didn't understand, please repeat"); // eslint-disable-line
      this.time = setTimeout(async () => {
        await Voice.start('en-US');
      }, 2500);
    } else {
      clearTimeout(this.time);
      Tts.speak('see you');
    }
  };

  onSpeechEnd = e => {
    console.log('This is the EEEND', e);
  };

  onSpeechStart = e => {
    console.log('started', e);
  };

  onSpeechRecognized = e => {
    console.log('recognized', e);
  };

  onSpeechResults = async e => {
    Tts.speak(e.value[0]);
    const dialogflowResponse = await getDialogFlow(e.value[0]);
    console.log(dialogflowResponse.result.fulfillment.speech);
  };

  _startRecognition = () => {
    clearTimeout(this.time);
    Tts.speak('what would you like to do');
    this.time = setTimeout(async () => {
      await Voice.start('en-US');
    }, 1000);
  };

  render() {
    return (
      <Button rounded style={styles.button}>
        <Text>Speak</Text>
      </Button>
    );
  }
}
