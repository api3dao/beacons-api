import axios from 'axios';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { go } from '@api3/airnode-utilities';
import { Client } from '@sendgrid/client';
// There doesn't appear to be a way around require here
import sgMail = require('@sendgrid/mail');
import { getGlobalConfig } from './utils';

sgMail.setClient(new Client());

const config = getGlobalConfig();

// The contact form POST payload schema
// We don't want to constrain this schema too much as it may change.
const contactFormDataSchema = z
  .object({
    contactOption: z.union([z.literal('telegram'), z.literal('discord'), z.literal('email')]),
    userName: z.string(),
    token: z.string(),
    order: z.object({
      chainId: z.string(),
      items: z.any(), // TODO z.array(z.object({ beaconId: z.string(), coverage: z.string(), months: z.string(), fee: z.string() }))
    }),
    groupName: z.string().optional(),
  })
  .strict();

// Credentials for SendGrid
const smtpSettingsSchema = z.object({
  API3_RECEIVER_MAIL: z.string(),
  API3_SENDER_MAIL: z.string(),
  SENDGRID_API_KEY: z.string(),
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

  const parsedBody = JSON.parse(event.body);
  const safeBody = contactFormDataSchema.safeParse(parsedBody);
  if (!safeBody.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: 'Invalid post body',
    };
  }

  const contactForm = safeBody.data;

  const [err, isValidCaptcha] = await go(() => validateToken(contactForm.token), { timeoutMs: 5_000 });
  if (err) {
    const typedError = err as Error;
    console.error(JSON.stringify(typedError, null, 2));

    return {
      statusCode: 500,
      headers: config.headers,
      body: 'An error occurred while validating the captcha',
    };
  }

  if (!isValidCaptcha) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: 'Invalid captcha',
    };
  }

  const [errEmail] = await go(async () => await sendEmail(contactForm), { timeoutMs: 5_000 });

  if (errEmail) {
    const typedError = errEmail as Error;
    console.error(JSON.stringify(typedError, null, 2));

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
}: Omit<z.infer<typeof contactFormDataSchema>, 'token'>) => {
  const smtpParsed = smtpSettingsSchema.safeParse(process.env);
  if (!smtpParsed.success) {
    console.error('Validation of ENVs for SMTP failed');
    throw smtpParsed.error;
  }

  const { SENDGRID_API_KEY, API3_RECEIVER_MAIL, API3_SENDER_MAIL } = smtpParsed.data;

  const cleanGroupName = groupName ? `Group Name: ${groupName}` : '';

  sgMail.setApiKey(SENDGRID_API_KEY);
  const msg = {
    to: API3_RECEIVER_MAIL,
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
    const typedError = error as Error;
    console.error(JSON.stringify(typedError, null, 2));

    throw new Error('Error while attempting to validate ReCaptcha');
  }
};
