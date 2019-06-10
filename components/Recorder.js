import React from 'react';
import {
  // AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Platform,
  NativeModules,
  // PermissionsAndroid,
} from 'react-native';
import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from 'react-native-audio';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b608a',
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50,
    color: '#fff',
  },
  button: {
    padding: 20,
  },
  disabledButtonText: {
    color: '#eee',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
  activeButtonText: {
    fontSize: 20,
    color: '#B81F00',
  },
});

export default class Recorder extends React.Component {
  state = {
    currentTime: 0.0,
    recording: false,
    paused: false,
    stoppedRecording: false,
    audioPath: `${AudioUtils.DocumentDirectoryPath}/test.aac`,
    hasPermission: undefined,
  };

  componentDidMount() {
    const { audioPath } = this.state;
    console.log('native modules', NativeModules);
    console.log(AudioUtils);
    AudioRecorder.requestAuthorization().then(isAuthorised => {
      this.setState({ hasPermission: isAuthorised });
      if (!isAuthorised) return;
      this.prepareRecordingPath(audioPath);
      AudioRecorder.onProgress = data => {
        this.setState({ currentTime: Math.floor(data.currentTime) });
      };
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

  _renderButton = (title, onPress, active) => {
    const style = active ? styles.activeButtonText : styles.buttonText;
    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>{title}</Text>
      </TouchableHighlight>
    );
  };

  _renderPauseButton = (onPress, active) => {
    const { paused } = this.state;
    const style = active ? styles.activeButtonText : styles.buttonText;
    const title = paused ? 'RESUME' : 'PAUSE';
    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>{title}</Text>
      </TouchableHighlight>
    );
  };

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

  async _stop() {
    const { recording } = this.state;
    if (!recording) {
      console.warn("Can't stop, not recording!"); //eslint-disable-line
      return;
    }
    this.setState({ stoppedRecording: true, recording: false, paused: false });
    try {
      const filePath = await AudioRecorder.stopRecording();
      console.log(filePath);
      if (Platform.OS === 'android') {
        this._finishRecording(true, filePath);
      }
      return filePath;
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
      AudioRecorder.onProgress = data => console.log(data);
    } catch (error) {
      console.error(error);
    }
  }

  _finishRecording(didSucceed, filePath, fileSize) {
    const { currentTime } = this.state;
    console.log(
      `Finished recording of duration ${currentTime} seconds at path: ${filePath} and size of ${fileSize ||
        0} bytes`,
    );
  }

  render() {
    const { recording, paused, currentTime } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          {this._renderButton(
            'RECORD',
            () => {
              this._record();
            },
            recording,
          )}
          {this._renderButton('PLAY', () => {
            this._play();
          })}
          {this._renderButton('STOP', () => {
            this._stop();
          })}
          {/* {this._renderButton('PAUSE', () => {this._pause()} )} */}
          {this._renderPauseButton(() =>
            paused ? this._resume() : this._pause(),
          )}
          <Text style={styles.progressText}>{currentTime}s</Text>
        </View>
      </View>
    );
  }
}
