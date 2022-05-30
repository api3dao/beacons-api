import { makeError } from './utils';
const axios = require('axios').default;

export const validateToken = async (event: { body: string }) => {
  const recaptcha = event.body;
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const recaptchaResponse = axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptcha}`
  );

  const response = await recaptchaResponse.json();

  if (response.success) {
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          success: response.success,
        },
        null,
        2
      ),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify(
      {
        message: makeError('invalid user input'),
        success: response.success,
        input: event.body,
      },
      null,
      2
    ),
  };
};
