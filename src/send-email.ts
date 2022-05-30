import { makeError } from './utils';
const nodemailer = require('nodemailer');

export const sendEmail = async (event: { body: string; }) => {
  const email = event.body;

  const firstEmailValidate = /^([\.\_a-zA-Z0-9]+)@([a-zA-Z]+)\.([a-zA-Z]){2,8}$/;
  const secondEmailValidate = /^([\.\_a-zA-Z0-9]+)@([a-zA-Z]+)\.([a-zA-Z]){2,3}\.[a-zA-Z]{1,3}$/;

  // validate email
  if (firstEmailValidate.test(email) || secondEmailValidate.test(email)) {
    // createTransporter instance
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const data = {
      from: process.env.FROM_EMAIL, // sender address
      to: email, //  receiver
      subject: process.env.EMAIL_SUBJECT, // Subject line
      text: process.env.EMAIL_TEXT, // Message , // email body
    };

    // send mail with defined transport object
    const response = await transporter.sendMail(data);

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          response: response.messageId,
          body: email,
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
        message: makeError('invalid email address'),
        body: email,
      },
      null,
      2
    ),
  };
};
