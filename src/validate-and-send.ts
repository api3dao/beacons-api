import * as sgMail from '@sendgrid/mail';
import axios from 'axios';
import { makeError } from './utils';

interface Data {
  contactOption: string;
  userName: string;
  token: string;
  order: string;
  groupName?: string;
}

export const validateAndSend = async (event: { body: Data }) => {
  const { token, contactOption, userName, order, groupName } = event.body;

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
  await sendEmail(contactOption, userName, order, groupName);
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

const sendEmail = async (contactOption: string, userName: string, order: string, groupName?: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('No SENDGRID_API_KEY ENV found.');
    return;
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // need to check all email env before sending email

  try {
    await sgMail.send({
      to: {
        email: process.env.API3_RECEIVER_EMAIL,
      },
      from: {
        email: process.env.API3_SENDER_EMAIL!,
      },
      subject: 'Order recieved',
      // templateId and dynamic data removed
      text: JSON.stringify({
        contactOption,
        userName,
        order,
        groupName,
      }),
    });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('sending email failed');
    return;
  }
};
