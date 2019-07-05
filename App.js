import React from 'react';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import KabeepsList from './components/KabeepsList';
import HomeScreen from './components/Home';
import LoginForm from './components/Login';
import SignUpForm from './components/SignUp';

const AppNavigator = createStackNavigator({
  Home: {
    screen: HomeScreen,
  },
  Login: {
    screen: LoginForm,
    navigationOptions: { headerLeft: null, gesturesEnabled: false },
  },
  SignUp: {
    screen: SignUpForm,
  },
  KabeepsList: {
    screen: KabeepsList,
  },
});

const AppContainer = createAppContainer(AppNavigator);

const App = () => <AppContainer />;

export default App;
