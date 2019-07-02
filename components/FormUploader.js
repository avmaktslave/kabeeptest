import { signUp, signIn, localhostServer } from '../constants/paths';

export const sendSignUpRequest = credentials => {
  const data = {
    method: 'POST',
    body: JSON.stringify({
      ...credentials,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return fetch(localhostServer + signUp, data)
    .then(res => {
      if (res.status === 200) {
        return res.json();
      }
    })
    .catch(err => console.log(err));
};

export const sendSignInRequest = credentials => {
  const data = {
    method: 'POST',
    body: JSON.stringify({
      ...credentials,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return fetch(localhostServer + signIn, data)
    .then(res => {
      if (res.status === 200) {
        return res.json();
      }
    })
    .catch(err => console.log(err));
};
