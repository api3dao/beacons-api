import sgMail from '@sendgrid/mail';
import axios from 'axios';
import { makeError } from './utils';

interface Data {
  contactOption: string;
  userName: string;
  groupName?: string;
  token: string;
  order: string;
}

export const validateAndSend = async (event: { body: Data }) => {
  const { contactOption, userName, groupName, token, order } = event.body;
  const userOrdered = JSON.parse(order);
  const response = await validateToken(token);
  const success = response.data.success;

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
  const requiredEnvs = ['SENDGRID_API_KEY', 'API3_RECEIVER_MAIL', 'API3_SENDER_MAIL', 'SENDGRID_TEMPLATE_ID' ];
  requiredEnvs.forEach(env => {
    if (!process.env[env]) {
      throw new Error(`No ${env} ENV found.`);
    }
  });
//    { text: string } | { html: string } | { templateId: string } | { content: MailContent[] & { 0: MailContent } });
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  await sgMail.send({
    to: {
      email: process.env.API3_RECEIVER_MAIL!,
    },
    from: {
      email: process.env.API3_SENDER_MAIL!,
    },
    templateId: process.env.SENDGRID_TEMPLATE_ID!,
    dynamicTemplateData: {
      contactOption,
      userName,
      userOrdered,
      groupName: groupName,
    },
  });
};
