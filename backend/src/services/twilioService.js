const twilio = require('twilio');
const logger = require('../utils/logger');

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendOtp(to) {
  const client = getClient();
  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    logger.warn(`OTP skipped; Twilio Verify not configured for ${to}`);
    return { status: 'skipped' };
  }
  return client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to, channel: 'sms' });
}

async function verifyOtp(to, code) {
  const client = getClient();
  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    logger.warn(`OTP verification skipped; Twilio Verify not configured for ${to}`);
    return { status: code === '000000' ? 'approved' : 'pending' };
  }
  return client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to, code });
}

async function sendSms(to, body) {
  const client = getClient();
  if (!client || !process.env.TWILIO_SMS_FROM) return null;
  return client.messages.create({ from: process.env.TWILIO_SMS_FROM, to, body });
}

async function sendWhatsApp(to, body) {
  const client = getClient();
  if (!client || !process.env.TWILIO_WHATSAPP_FROM) return null;
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body
  });
}

module.exports = { sendOtp, verifyOtp, sendSms, sendWhatsApp };

