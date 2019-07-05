import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { Button, Text } from 'native-base';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import AsyncStorage from '@react-native-community/async-storage';

import { _uploadAudioToAWS } from '../utils/RecordUploader';
import { getDialogFlow } from '../utils/df_request';

import {
  cancelPhrase,
  finishRecPhrase,
  greetingPhrase,
  startPhrase,
} from '../constants/ttsPhrases';

const styles = StyleSheet.create({
  assistentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
  },
  button: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginBottom: 20,
    margin: 20,
  },
  recControls: {
    flexDirection: 'row',
    backgroundColor: '#F5FCFF',
    flex: 0.2,
    shadowRadius: 2,
    marginTop: 5,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowColor: '#000000',
    elevation: 1,
  },
  recControlButton: {
    alignSelf: 'center',
    backgroundColor: '#DDDDDD',
    margin: 10,
    borderRadius: 30,
    color: '#eee',
  },
  transcript: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: 1,
    top: '400%',
  },
});

export default class VoiceAssistent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false,
      allowRecognition: false,
      isRecording: false,
      isPaused: false,
      stoppedRecording: false,
      audioPath: `${AudioUtils.DocumentDirectoryPath}/test.aac`,
      hasPermission: undefined,
    };
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = e => {
      console.log(e.value);
      const { isRecording } = this.state;
      if (isRecording && Platform.OS === 'ios') {
        this.stopRecordingByVoice(e);
      }
    };
    // Voice.onSpeechError = this.onSpeechError;
  }

  async componentDidMount() {
    await Tts.getInitStatus();
    Tts.addEventListener('tts-finish', this.finishTextToSpeechHandler);
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
    Tts.speak(greetingPhrase);
    const { audioPath } = this.state;
    AudioRecorder.requestAuthorization().then(isAuthorised => {
      this.setState({ hasPermission: isAuthorised });
      if (!isAuthorised) return;
      this.prepareRecordingPath(audioPath);
    });
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  finishTextToSpeechHandler = async () => {
    const { allowRecognition, isRecording, isPlaying } = this.state;
    if (allowRecognition) {
      try {
        await Voice.start();
      } catch (error) {
        console.error(error);
      }
    }
    if (isRecording) {
      this._record();
    }
    if (isPlaying) {
      this._play();
    }
  };

  prepareRecordingPath = audioPath => {
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 44100,
      Channels: 1,
      AudioQuality: 'High',
      AudioEncoding: 'aac',
      AudioEncodingBitRate: 32000,
      MeteringEnabled: true,
    });
  };

  onSpeechError = async e => {
    console.log('onSpeechError');
    // ? check if it work fine
    if (e.error.message.includes('7')) {
      const dialogflowResponse = await getDialogFlow('onSpeechError');
      await Tts.speak(dialogflowResponse.result.fulfillment.speech);
    } else {
      this.setState({ allowRecognition: false });
      Tts.speak('see you');
    }
  };

  onSpeechResults = async e => {
    const { isRecording: isRecordingNow, stoppedRecording } = this.state;
    if (!isRecordingNow && !stoppedRecording) {
      let dialogflowResponse = {};
      e.value[0].toLowerCase().includes('stop')
        ? null
        : (dialogflowResponse = await getDialogFlow(e.value[0]));
      if (dialogflowResponse.result.metadata.intentName === 'Record') {
        this.setState({ allowRecognition: false, isRecording: true });
        Tts.speak(dialogflowResponse.result.fulfillment.speech);
      } else if (
        dialogflowResponse.result.metadata.intentName ===
        'Confirm playing after record'
      ) {
        this.setState({ isPlaying: true, allowRecognition: false });
        Tts.speak(dialogflowResponse.result.fulfillment.speech);
      } else if (dialogflowResponse.result.metadata.intentName === 'Play') {
        //! resolve this first
        Tts.speak(dialogflowResponse.result.fulfillment.speech);
        if (dialogflowResponse.result.parameters.last === '') {
          this.time = setTimeout(async () => {
            await Voice.start('en-US');
          }, 3000);
        } else {
          this._play();
        }
      } else if (dialogflowResponse.result.metadata.intentName === 'Cancel') {
        await Tts.speak(cancelPhrase);
        this.setState({ allowRecognition: false });
        Voice.stop();
      } else {
        await Tts.speak(dialogflowResponse.result.fulfillment.speech);
      }
    } else if (isRecordingNow && !stoppedRecording) {
      Voice.start();
    }
  };

  _startRecognition = () => {
    Tts.getInitStatus().then(() => Tts.speak(startPhrase)); // eslint-disable-line
    this.setState({ allowRecognition: true });
  };

  _finishRecording = async () => {
    const { audioPath } = this.state;
    await Tts.speak(finishRecPhrase);
    this.setState({
      stoppedRecording: false,
    });
    let user = {};
    try {
      await AsyncStorage.getItem('user').then(value => {
        user = JSON.parse(value);
      });
    } catch (err) {
      console.log('finishRecording', err);
    }
    const { token } = user;
    await _uploadAudioToAWS(audioPath, token);
  };

  _record = async () => {
    const { audioPath, hasPermission, stoppedRecording } = this.state;
    this.prepareRecordingPath(audioPath);
    if (!hasPermission) {
      console.warn("Can't record, no permission granted!"); //eslint-disable-line
      return;
    }
    if (stoppedRecording) {
      this.prepareRecordingPath(audioPath);
    }
    this.setState({ isPaused: false });
    try {
      await AudioRecorder.startRecording();
      if (Platform.OS === 'ios') {
        Voice.start();
        const timing = [];
        AudioRecorder.onProgress = data => {
          if (data.currentPeakMetering > -24) {
            timing.length = 0;
          } else {
            timing.push(Math.floor(data.currentTime));
            Math.floor(data.currentTime) - timing[0] === 9 &&
              this._stopRecording();
          }
        };
      } else if (Platform.OS === 'android') {
        const timing = [];
        AudioRecorder.onProgress = data => {
          if (data.currentMetering > 5000) {
            timing.length = 0;
          } else {
            timing.push(Math.floor(data.currentTime));
            Math.floor(data.currentTime) - timing[0] === 4 &&
              this._stopRecording();
          }
        };
      }
    } catch (error) {
      console.error(error);
    }
  };

  _stopRecording = async () => {
    const { isRecording } = this.state;
    this.setState({
      stoppedRecording: true,
      isRecording: false,
      isPaused: false,
      allowRecognition: true,
    });
    if (!isRecording) {
      console.warn("Can't stop, not isRecording!"); //eslint-disable-line
      return;
    }
    try {
      const filePath = await AudioRecorder.stopRecording();
      setTimeout(() => {
        this._finishRecording();
      }, 0);
      return filePath;
    } catch (error) {
      console.error(error);
    }
  };

  _pause = async () => {
    try {
      await AudioRecorder.pauseRecording();
      this.setState({ isPaused: true });
    } catch (error) {
      console.error(error);
    }
  };

  _resume = async () => {
    try {
      await AudioRecorder.resumeRecording();
      this.setState({ isPaused: false });
    } catch (error) {
      console.error(error);
    }
  };

  _play = async () => {
    const { isRecording, audioPath } = this.state;
    if (isRecording) {
      await this._stopRecording();
    }
    // These timeouts are a hacky workaround for some issues with react-native-sound.
    // See https://github.com/zmxv/react-native-sound/issues/89.
    setTimeout(() => {
      const sound = new Sound(audioPath, '', error => {
        if (error) {
          console.log('failed to load the sound', error);
        }
      });
      setTimeout(() => {
        sound.play(success => {
          if (success) {
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
          this.setState({
            isPlaying: false,
          });
        });
      }, 100);
    }, 100);
  };

  async stopRecordingByVoice(e) {
    if (
      e.value[0] ===
        ('Stop' ||
          'Stop isRecording' ||
          'Stop kabeep' ||
          'Stop isRecording kabeep' ||
          'stop') ||
      e.value[0].toLowerCase().includes('stop isRecording')
    ) {
      console.log('stopRecordingByVoice');
      Voice.stop();
      this._stopRecording();
    }
  }

  render() {
    const { isRecording, allowRecognition, isPaused } = this.state;
    return (
      <View style={styles.assistentWrapper}>
        <Button
          style={styles.button}
          onPress={this._startRecognition}
          disable={allowRecognition}
        >
          <Text style={{ color: '#A9A9A9' }}>Speak</Text>
        </Button>

        <Button
          style={styles.button}
          onPress={() => {
            this.setState({ allowRecognition: false, isRecording: true });
            Tts.speak('ok');
          }}
        >
          <Text style={{ textAlign: 'center', width: 90, color: '#A9A9A9' }}>
            Record
          </Text>
        </Button>

        {isRecording ? (
          <View style={styles.recControls}>
            <Button
              style={styles.recControlButton}
              onPress={this._stopRecording}
              disable={allowRecognition}
            >
              <Text>Stop</Text>
            </Button>
            <Button
              style={styles.recControlButton}
              onPress={isPaused ? this._resume : this._pause}
              disable={allowRecognition}
            >
              <Text>{isPaused ? 'Resume' : 'Pause'}</Text>
            </Button>
          </View>
        ) : null}
      </View>
    );
  }
}
