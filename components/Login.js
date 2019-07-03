import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/dist/FontAwesome';

import { sendSignInRequest } from './FormUploader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderBottomWidth: 1,
    width: 250,
    height: 45,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputs: {
    height: 45,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  inputIcon: {
    fontSize: 20,
    marginLeft: 15,
    justifyContent: 'center',
  },
  errorMessage: {
    position: 'absolute',
    top: 50,
    left: 50,
    color: '#eb5e55',
  },
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 250,
    borderRadius: 30,
  },
  loginButton: {
    backgroundColor: '#00b5ec',
  },
  loginText: {
    color: 'white',
  },
  resultMessage: {
    color: 'green',
    marginBottom: 20,
    fontSize: 20,
  },
  resultMessageError: {
    color: 'red',
    marginBottom: 20,
    fontSize: 20,
  },
});

export default class LoginForm extends Component {
  state = {
    signInError: false,
    resultMessage: false,
  };

  onClickListener = async viewId => {
    const { navigation } = this.props;
    if (viewId === 'register') {
      navigation.navigate('SignUp');
    }
  };

  submitForm = async formData => {
    const { navigation } = this.props;
    try {
      const user = await sendSignInRequest(formData);
      const { statusCode, data } = user;
      if (statusCode === 200) {
        const { email, token } = data;
        await AsyncStorage.setItem('user', JSON.stringify({ email, token }));
        this.setState({
          signInError: false,
          resultMessage: 'Your sign in is successful',
        });
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1000);
      } else {
        this.setState({
          signInError: true,
          resultMessage: user.text,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  render() {
    const { resultMessage, signInError } = this.state;
    return (
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validate={values => {
          const errors = {};
          if (!values.email) {
            errors.email = 'Required';
          } else if (
            // eslint-disable-next-line no-useless-escape
            !/^([a-z0-9_\.-]+)@([a-z0-9_\.-]+)\.([a-z\.]{2,6})$/i.test(
              values.email,
            )
          ) {
            errors.email = 'Invalid email address';
          }
          if (!values.password) {
            errors.password = 'Required';
          } else if (values.password.length < 4) {
            errors.password = 'Must be longer then 3 simbols';
          }
          return errors;
        }}
        onSubmit={this.submitForm}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
        }) => (
          <View style={styles.container}>
            <Text style={{ marginBottom: 20, color: '#8c858f' }}>
              Enter your sign in data
            </Text>
            {resultMessage ? (
              <Text
                style={
                  signInError ? styles.resultMessageError : styles.resultMessage
                }
              >
                {resultMessage}
              </Text>
            ) : null}
            <View style={styles.inputContainer}>
              <Icon style={styles.inputIcon} name="envelope"></Icon>
              <TextInput
                style={styles.inputs}
                placeholder="Email"
                keyboardType="email-address"
                underlineColorAndroid="transparent"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />
              <Text style={styles.errorMessage}>
                {errors.email && touched.email && errors.email}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Icon style={styles.inputIcon} name="key"></Icon>
              <TextInput
                style={styles.inputs}
                placeholder="Password"
                secureTextEntry
                underlineColorAndroid="transparent"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
              />
              <Text style={styles.errorMessage}>
                {errors.password && touched.password && errors.password}
              </Text>
            </View>

            <TouchableHighlight
              style={[styles.buttonContainer, styles.loginButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.buttonContainer}
              onPress={() => this.onClickListener('restore_password')}
            >
              <Text>Forgot your password?</Text>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.buttonContainer}
              onPress={() => this.onClickListener('register')}
            >
              <Text>Register</Text>
            </TouchableHighlight>
          </View>
        )}
      </Formik>
    );
  }
}

LoginForm.navigationOptions = () => {
  return {
    headerTitle: (
      <Text
        style={{
          marginLeft: 10,
          fontFamily: 'Arial',
          fontSize: 20,
          color: '#696969',
        }}
      >
        Login
      </Text>
    ),
    headerStyle: { backgroundColor: '#D3D3D3' },
  };
};

LoginForm.propTypes = {
  navigation: PropTypes.instanceOf(Object).isRequired,
};
