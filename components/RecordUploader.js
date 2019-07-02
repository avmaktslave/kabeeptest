import { localhostServer, s3policy } from '../constants/paths';

const getPresignedUrl = () => {
  const headers = { Accept: 'application/json' };
  return fetch(localhostServer + s3policy, {
    method: 'GET',
    headers,
  })
    .then(res => res.json())
    .catch(err => {
      console.log(err);
    });
};

export const _uploadAudioToAWS = async audioPath => {
  console.log('uploadAudioToServer');
  const { data: sign } = await getPresignedUrl();
  console.log(sign);
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
      console.log(res);
      res.json();
    })
    .catch(err => console.log(err));

  // const path = `file://${audioPath}`;
  // const formData = new FormData();
  // formData.append('file', {
  //   uri: path,
  //   name: 'test.aac',
  //   type: 'audio/aac',
  // });
  // await fetch(localhostServer + uploadAudioToServer, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  //   body: formData,
  // })
  //   .then(res => {
  //     return res.json();
  //   })
  //   .catch(err => console.log(err));
};
