import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Button, Text } from 'native-base';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import { getDialogFlow } from '../utils/df_request';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  button: {
    alignSelf: 'center',
    margin: 20,
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
      recording: false,
      paused: false,
      stoppedRecording: false,
      audioPath: `${AudioUtils.DocumentDirectoryPath}/test.aac`,
      hasPermission: undefined,
    };
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
  }

  componentDidMount() {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
      Tts.speak('Welcom to Kabeep service. Press the Speak button to call me'); // eslint-disable-line
    });
    const { audioPath } = this.state;
    AudioRecorder.requestAuthorization().then(isAuthorised => {
      this.setState({ hasPermission: isAuthorised });
      if (!isAuthorised) return;
      this.prepareRecordingPath(audioPath);
      AudioRecorder.onFinished = data => {
        // Android callback comes in the form of a promise instead.
        if (Platform.OS === 'ios') {
          this._finishRecording(
            data.status === 'OK',
            data.audioFileURL,
            data.audioFileSize,
          );
        }
      };
    });
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

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
    clearTimeout(this.time);
    if (e.error.message.includes('7')) {
      const dialogflowResponse = await getDialogFlow('bla bla bla');
      await Tts.speak(dialogflowResponse.result.fulfillment.speech); // eslint-disable-line
      this.time = setTimeout(async () => {
        await Voice.start('en-US');
      }, 2500);
    } else {
      clearTimeout(this.time);
      console.log('EEEEERORROORO');
      Tts.speak('see you');
    }
  };

  onSpeechResults = async e => {
    console.log(e.value[0]);
    clearTimeout(this.time);
    const dialogflowResponse = await getDialogFlow(e.value[0]);
    await Tts.speak(dialogflowResponse.result.fulfillment.speech);
    console.log(dialogflowResponse);
    if (dialogflowResponse.result.metadata.intentName === 'Record') {
      setTimeout(() => {
        console.log('record started');
        this._record();
      }, 5500);
    } else if (
      dialogflowResponse.result.metadata.intentName ===
      'Confirm playing after record'
    ) {
      setTimeout(() => {
        this._play();
      }, 2000);
    } else if (dialogflowResponse.result.metadata.intentName === 'Play') {
      if (dialogflowResponse.result.parameters.last === '') {
        this.time = setTimeout(async () => {
          await Voice.start('en-US');
        }, 3000);
      } else {
        this._play();
      }
    } else {
      this.time = setTimeout(async () => {
        await Voice.start('en-US');
      }, 3500);
    }
  };

  _startRecognition = () => {
    clearTimeout(this.time);
    Tts.getInitStatus().then(() => Tts.speak("Great, I'm here")); // eslint-disable-line
    this.time = setTimeout(async () => {
      await Voice.start('en-US');
    }, 1000);
  };

  async _record() {
    const {
      recording,
      audioPath,
      hasPermission,
      stoppedRecording,
    } = this.state;
    if (recording) {
      console.warn('Already recording!');
      return;
    }
    if (!hasPermission) {
      console.warn("Can't record, no permission granted!"); //eslint-disable-line
      return;
    }
    if (stoppedRecording) {
      this.prepareRecordingPath(audioPath);
    }
    this.setState({ recording: true, paused: false });
    try {
      await AudioRecorder.startRecording();
      if (Platform.OS === 'ios') {
        const timing = [];
        AudioRecorder.onProgress = data => {
          if (data.currentPeakMetering > -24) {
            timing.length = 0;
          } else {
            timing.push(Math.floor(data.currentTime));
            Math.floor(data.currentTime) - timing[0] === 3 &&
              this._stop() &&
              Tts.speak('the recording is finished');
          }
        };
      } else if (Platform.OS === 'android') {
        const timing = [];
        AudioRecorder.onProgress = data => {
          if (data.currentMetering > 2500) {
            timing.length = 0;
          } else {
            timing.push(Math.floor(data.currentTime));
            Math.floor(data.currentTime) - timing[0] === 3 &&
              this._stop() &&
              Tts.speak('the recording is finished');
          }
        };
      }
    } catch (error) {
      console.error(error);
    }
  }

  async _stop() {
    const { recording } = this.state;
    if (!recording) {
      console.warn("Can't stop, not recording!"); //eslint-disable-line
      return;
    }
    this.setState({ stoppedRecording: true, recording: false, paused: false });
    try {
      const filePath = await AudioRecorder.stopRecording();
      setTimeout(() => {
        this._finishRecording();
      }, 0);
      console.log('AFTER FINISH');
      return filePath;
    } catch (error) {
      console.error(error);
    }
  }

  _finishRecording() {
    Tts.speak('Would you like to hear your Kabeep?');
    this.time = setTimeout(async () => {
      await Voice.start('en-US');
    }, 2500);
  }

  async _pause() {
    const { recording } = this.state;
    if (!recording) {
      console.warn("Can't pause, not recording!"); //eslint-disable-line
      return;
    }
    try {
      await AudioRecorder.pauseRecording();
      this.setState({ paused: true });
    } catch (error) {
      console.error(error);
    }
  }

  async _resume() {
    const { paused } = this.state;
    if (!paused) {
      console.warn("Can't resume, not paused!"); //eslint-disable-line
      return;
    }
    try {
      await AudioRecorder.resumeRecording();
      this.setState({ paused: false });
    } catch (error) {
      console.error(error);
    }
  }

  async _play() {
    const { recording, audioPath } = this.state;
    if (recording) {
      await this._stop();
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
        });
      }, 100);
    }, 100);
  }

  render() {
    return (
      <Button bordered style={styles.button} onPress={this._startRecognition}>
        <Text>Speak</Text>
      </Button>
    );
  }
}
