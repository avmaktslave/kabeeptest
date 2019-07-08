import {
  localhostServer,
  s3policy,
  kabeepToTable,
  getKabeeps,
  loadAudioAws,
} from '../constants/paths';

const getPresignedUrl = token => {
  const headers = { Accept: 'application/json', Authorization: token };
  return fetch(localhostServer + s3policy, {
    method: 'GET',
    headers,
  })
    .then(res => res.json())
    .catch(err => {
      console.log(err);
    });
};

export const loadAudioFromAWS = async (token, key) => {
  const data = {
    method: 'POST',
    body: JSON.stringify({
      key,
    }),
    headers: {
      Authorization: token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  const awsUrl = await fetch(localhostServer + loadAudioAws, data)
    .then(res => res.json())
    .then(presignedUrl => {
      return presignedUrl.data;
    });
  return awsUrl;
};

export const getUsersKabeeps = async token => {
  const headers = { Accept: 'application/json', Authorization: token };
  const kabeeps = await fetch(localhostServer + getKabeeps, {
    method: 'GET',
    headers,
  }).then(response => response.json());
  return kabeeps;
};

const setKabeepIntoTable = (token, key, tags, geoloc, holiday) => {
  const kabeep = { key, tags, geoloc, holiday };
  const data = {
    method: 'POST',
    body: JSON.stringify({
      ...kabeep,
    }),
    headers: {
      Authorization: token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  return fetch(localhostServer + kabeepToTable, data)
    .then(res => {
      res.json();
    })
    .catch(err => {
      console.log(err);
    });
};

export const _uploadAudioToAWS = async (audioPath, token) => {
  const { data: sign } = await getPresignedUrl(token);
  const formData = new FormData();
  Object.keys(sign.fields).forEach(key => {
    formData.append(key, sign.fields[key]);
  });
  const path = `file://${audioPath}`;
  formData.append('file', {
    uri: path,
    name: 'test.aac',
    type: 'audio/aac',
  });
  await fetch(sign.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  })
    .then(res => {
      res.json();
      const { Key } = sign.fields;
      const tags = 'kabeep, grandpa advice, test'; // THis part should be filled by user when kabeep has been recorded
      const geo = 124.78;
      const holiday = 'ThanksGivinDay';
      setKabeepIntoTable(token, Key, tags, geo, holiday);
    })
    .catch(err => console.log('uploadAudioToAWSerror', err));
};
