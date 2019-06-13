export const getDialogFlow = async msg => {
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
