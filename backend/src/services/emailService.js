const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });
}

async function sendEmail({ to, subject, text, html }) {
  const transport = getTransport();
  if (!transport) {
    logger.warn(`Email skipped; SMTP not configured: ${subject}`);
    return null;
  }

  return transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendEmail };

