import handlebars from 'handlebars';
import nodemailer from 'nodemailer';

import { logger } from '@/server';

import { MailTrigger } from '../enums/enumBase';
import { VerifyEmailTemplate } from './mailTemplate';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (trigger: MailTrigger, context: any) => {
  try {
    let mailTemplate;

    // Get template based on trigger
    switch (trigger) {
      case MailTrigger.VerifyEmail:
        mailTemplate = VerifyEmailTemplate;
        break;
      default:
        logger.info(`Mail template not found for trigger: ${trigger}`);
        return;
    }

    const template = handlebars.compile(mailTemplate.content);
    const htmlToSend = template(context);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: context.email,
      subject: mailTemplate.subject,
      html: htmlToSend,
    };
    console.log(mailOptions);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    logger.info('Email sent successfully');
  } catch (ex) {
    logger.error(`Error sending email: ${(ex as Error).message}`);
  }
};
