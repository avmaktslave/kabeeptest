import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import PropTypes from 'prop-types';
import { Formik } from 'formik';
import Icon from 'react-native-vector-icons/dist/FontAwesome';

import { sendSignUpRequest } from './FormUploader';

const styles = StyleSheet.create({
  container: {
    borderWidth: 7,
    borderColor: '#d6d7da',
    flex: 1,
    justifyContent: 'space-between',
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
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 250,
    borderRadius: 30,
  },
  errorMessage: {
    position: 'absolute',
    top: 50,
    left: 50,
    color: '#eb5e55',
  },
  signUpButton: {
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
});

export default class SignUpForm extends Component {
  state = {
    signUpError: false,
    resultMessage: false,
  };

  onClickListener = async viewId => {
    const { navigation } = this.props;
    if (viewId === 'login') {
      navigation.navigate('Login');
    }
  };

  submitForm = async formData => {
    const { navigation } = this.props;
    try {
      const user = await sendSignUpRequest(formData);
      const { statusCode, data } = user;
      if (statusCode === 200) {
        const { email, token } = data;
        await AsyncStorage.setItem('user', JSON.stringify({ email, token }));
        this.setState({
          signUpError: false,
          resultMessage: 'Your sign up is successful',
        });
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1000);
      } else {
        this.setState({
          signUpError: true,
          resultMessage: user.text,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  render() {
    const { resultMessage, signUpError } = this.state;
    return (
      <ScrollView
        contentContainerStyle={{
          flex: 1,
        }}
      >
        <Formik
          initialValues={{
            email: '',
            password: '',
            firstName: '',
            phoneNumber: '',
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
            if (!values.firstName) {
              errors.firstName = 'Required';
            } else if (
              values.firstName.length < 2 ||
              values.firstName.length > 10
            ) {
              errors.firstName = 'Must be 2 - 10 simbols';
            }
            if (!values.password) {
              errors.password = 'Required';
            } else if (values.password.length < 4) {
              errors.password = 'Must be longer then 3 simbols';
            }
            if (!values.phoneNumber) {
              errors.phoneNumber = 'Required';
            }
            // } else if (
            //   // eslint-disable-next-line no-useless-escape
            //   !/^[0][1-9]\d{9}$|^[1-9]\d{9}$/i.test(values.email)
            // ) {
            //   errors.phoneNumber = 'the number you entered is invalid';
            // }
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
                Enter your sign up data
              </Text>
              {resultMessage ? (
                <Text
                  style={
                    signUpError
                      ? styles.resultMessageError
                      : styles.resultMessage
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
                <Icon style={styles.inputIcon} name="user"></Icon>
                <TextInput
                  style={styles.inputs}
                  placeholder="First name"
                  underlineColorAndroid="transparent"
                  onChangeText={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  value={values.firstName}
                />
                <Text style={styles.errorMessage}>
                  {errors.firstName && touched.firstName && errors.firstName}
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

              <View style={styles.inputContainer}>
                <Icon style={styles.inputIcon} name="mobile"></Icon>
                <TextInput
                  style={styles.inputs}
                  placeholder="Phone Number"
                  keyboardType="numeric"
                  underlineColorAndroid="transparent"
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  value={values.phoneNumber}
                />
                <Text style={styles.errorMessage}>
                  {errors.phoneNumber &&
                    touched.phoneNumber &&
                    errors.phoneNumber}
                </Text>
              </View>
              <TouchableHighlight
                style={[styles.buttonContainer, styles.signUpButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.loginText}>Sign Up</Text>
              </TouchableHighlight>

              <TouchableHighlight
                style={styles.buttonContainer}
                onPress={() => this.onClickListener('restore_password')}
              >
                <Text>Forgot your password?</Text>
              </TouchableHighlight>

              <TouchableHighlight
                style={styles.buttonContainer}
                onPress={() => this.onClickListener('login')}
              >
                <Text>Login</Text>
              </TouchableHighlight>
            </View>
          )}
        </Formik>
      </ScrollView>
    );
  }
}
// HEADER
SignUpForm.navigationOptions = () => {
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
        Sign Up
      </Text>
    ),
    headerStyle: { backgroundColor: '#D3D3D3' },
  };
};

SignUpForm.propTypes = {
  navigation: PropTypes.instanceOf(Object).isRequired,
};
