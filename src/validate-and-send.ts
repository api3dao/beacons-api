import axios from 'axios';
import { go } from '@api3/promise-utils';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { Client } from '@sendgrid/client';
// There doesn't appear to be a way around `require` here
import sgMail = require('@sendgrid/mail');
import { getGlobalConfig } from './utils';
import { contactUsPayloadSchema } from './validation/validate-and-send-form-data';
import { goQueryConfig } from './constants';

sgMail.setClient(new Client());

const config = getGlobalConfig();

// Credentials for SendGrid
const smtpSettingsSchema = z.object({
  API3_RECEIVER_MAIL: z.string(),
  API3_SENDER_MAIL: z.string(),
  SENDGRID_API_KEY: z.string(),
  CC_RECEIVER_MAIL: z.string().optional(),
});

/**
 * Validates the ReCaptcha token in a POST payload body and if valid proceeds to send an email with the contact form
 * data.
 *
 * @param event an AWS API Gateway Event
 */
export const validateAndSendEmail: APIGatewayProxyHandler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: 'Invalid post body',
    };
  }

  if (process.env.DEBUG) {
    console.debug(`Event: `, JSON.stringify(event, null, 2));
  }

  const parsedBody = JSON.parse(event.body);
  const safeBody = contactUsPayloadSchema.safeParse(parsedBody);
  if (!safeBody.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: 'Invalid post body',
    };
  }

  const contactForm = safeBody.data;

  const validateTokenResponse = await go(() => validateToken(contactForm.token), goQueryConfig);

  if (!validateTokenResponse.success) {
    console.error(JSON.stringify(validateTokenResponse.error, null, 2));

    return {
      statusCode: 500,
      headers: config.headers,
      body: 'An error occurred while validating the captcha',
    };
  }

  if (!validateTokenResponse.data.isValidCaptcha) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: 'Invalid captcha',
    };
  }

  const sendEmailResult = await go(async () => await sendEmail(contactForm), goQueryConfig);

  if (!sendEmailResult.success) {
    console.error(JSON.stringify(sendEmailResult.error, null, 2));

    return {
      statusCode: 500,
      headers: config.headers,
      body: 'An error occurred while attempting to send the email',
    };
  }

  return {
    statusCode: 200,
    headers: config.headers,
    body: 'Captcha validated and email sent successfully',
  };
};

/**
 * Sends an email containing contact form data
 *
 * @param contactOption
 * @param userName
 * @param order
 * @param groupName
 */
const sendEmail = async ({
  contactOption,
  userName,
  order,
  groupName,
}: Omit<z.infer<typeof contactUsPayloadSchema>, 'token'>) => {
  const smtpParsed = smtpSettingsSchema.safeParse(process.env);
  if (!smtpParsed.success) {
    console.error('Validation of ENVs for SMTP failed');
    throw smtpParsed.error;
  }

  const { SENDGRID_API_KEY, API3_RECEIVER_MAIL, API3_SENDER_MAIL, CC_RECEIVER_MAIL } = smtpParsed.data;

  const cleanGroupName = groupName ? `Group Name: ${groupName}` : '';

  sgMail.setApiKey(SENDGRID_API_KEY);
  const msg = {
    to: API3_RECEIVER_MAIL,
    cc: CC_RECEIVER_MAIL,
    from: API3_SENDER_MAIL, // Use the email address or domain you verified above
    subject: 'New order from API3 Explorer',
    text: `Contact Option: ${contactOption}
Username: ${userName}
${cleanGroupName}
Order: ${JSON.stringify(order, null, 2)}
`,
  };

  return await sgMail.send(msg);
};

const validateToken = async (token: string | null) => {
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
    const typedError = error as Error;
    console.error(JSON.stringify(typedError, null, 2));

    throw new Error('Error while attempting to validate ReCaptcha');
  }
};
