import { makeError } from './utils';
const sgMail = require('@sendgrid/mail');
const axios = require('axios').default;

interface Data {
  contactOption: string;
  userName: string;
  groupName?: string;
  token: string;
  order: string;
}
type SuccessResponse = true | false;

export const validateAndSend = async (event: { body: Data }) => {
  const { contactOption, userName, groupName, token, order } = event.body;
  const userOrdered = JSON.parse(order);
  const response = await validateToken(token);
  const success: SuccessResponse = response.data.success;

  if (success) {
    const response = await sendEmail(contactOption, userName, userOrdered, groupName);
    console.log(response[0].statusCode);
  }
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
};

const validateToken = async (token: string) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  return await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`);
};

const sendEmail = async (contactOption: string, userName: string, userOrdered: object, groupName?: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMail.send({
    to: {
      email: process.env.API3_RECEIVER_MAIL,
    },
    from: {
      email: process.env.API3_SENDER_MAIL,
    },
    template_id: process.env.SENDGRID_TEMPLATE_ID,
    dynamic_template_data: {
      contactOption,
      userName,
      userOrdered,
      groupName: groupName,
    },
  });
};
