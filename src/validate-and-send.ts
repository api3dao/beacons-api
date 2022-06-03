import nodemailer from 'nodemailer';
import axios from 'axios';
import { getGlobalConfig, makeError } from './utils';

const config = getGlobalConfig();

interface ContactFormData {
  contactOption: string;
  userName: string;
  token: string;
  order: string;
  groupName?: string;
}

export const validateAndSend = async (event: ContactFormData) => {
  const formData = event;

  if (!formData.token || !formData.contactOption || !formData.userName || !formData.order) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: makeError('Invalid payload'),
          headers: config.headers,
        },
        null,
        2
      ),
    };
  }

  const success = await validateToken(formData.token);

  if (!success) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: makeError('RECAPTCHA_SECRET_KEY validation failed'),
          headers: config.headers,
        },
        null,
        2
      ),
    };
  }

  await sendEmail(formData);
};

const validateToken = async (token: string) => {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY not found');
    return;
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );

    return response.data.success;
  } catch (error) {
    console.log('Something went wrong');
    return;
  }
};

const sendEmail = async (form: ContactFormData) => {
  const envValues = [
    'MAILTRAP_HOST',
    'MAILTRAP_PORT',
    'MAILTRAP_USER',
    'MAILTRAP_PASS',
    'MAILTRAP_SENDER_EMAIL',
    'MAILTRAP_RECEIVER_EMAIL',
  ];
  envValues.forEach((value) => {
    if (!process.env[value]) {
      throw new Error(`${value} is not set`);
    }
  });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    // send mail with defined transport object
    const message = {
      from: process.env.MAILTRAP_SENDER_EMAIL,
      to: process.env.MAILTRAP_RECEIVER_EMAIL,
      subject: 'Order Received',
      text: JSON.stringify(form),
    };
    await transporter.sendMail(message);

    console.log('Email sent successfully');
  } catch (error) {
    console.log(error);
  }
};
