import * as sgMail from '@sendgrid/mail';
import axios from 'axios';
import { makeError } from './utils';

interface Data {
  contactOption: string;
  userName: string;
  token: string;
  order: string;
}

export const validateAndSend = async (event: { body: Data }) => {
  const { token, contactOption, userName, order } = event.body;

  if (!token || !contactOption || !userName || !order) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: makeError('invalid payload'),
        },
        null,
        2
      ),
    };
  }

  const success = await validateToken(token);
  if (!success) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: makeError('recaptcha validation failed'),
        },
        null,
        2
      ),
    };
  }
  await sendEmail(contactOption, userName, order);
};

const validateToken = async (token: string) => {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.error('No RECAPTCHA_SECRET_KEY found');
    return;
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );

    return response.data.success;
  } catch (error) {
    console.error('something went wrong');
    return;
  }
};

const sendEmail = async (contactOption: string, userName: string, order: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('No SENDGRID_API_KEY ENV found.');
    return;
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: process.env.API3_SENDER_EMAIL,
      from: process.env.API3_RECEIVER_EMAIL,
      subject: 'Order Recieved',
      templateId: process.env.SENDGRID_TEMPLATE_ID,
      substitutions: {
        contactOption,
        userName,
        order,
      },
    });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('sending email failed');
    return;
  }
};
