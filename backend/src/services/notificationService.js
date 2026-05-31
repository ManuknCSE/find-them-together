const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const { sendSms, sendWhatsApp } = require('./twilioService');
const { emitToUser, emitGlobal } = require('./socketService');

async function createNotification({ recipient, type, title, message, channels = ['in_app'], data = {} }) {
  const notification = await Notification.create({ recipient, type, title, message, channels, data });

  if (recipient) {
    emitToUser(recipient, 'notification:new', notification);
  } else {
    emitGlobal('notification:new', notification);
  }

  const user = recipient ? await User.findById(recipient) : null;
  if (user) {
    const phone = `${user.countryCode}${user.mobileNumber}`;
    if (channels.includes('email') && user.email) {
      try { await sendEmail({ to: user.email, subject: title, text: message }); } catch (e) { /* email delivery failed, log silently */ }
    }
    if (channels.includes('sms') && user.mobileNumber) {
      try { await sendSms(phone, message); } catch (e) { /* sms delivery failed */ }
    }
    if (channels.includes('whatsapp') && user.mobileNumber) {
      try { await sendWhatsApp(phone, message); } catch (e) { /* whatsapp delivery failed */ }
    }
  }

  notification.deliveredAt = new Date();
  await notification.save();
  return notification;
}

async function triggerEmergencyMatch({ caseDoc, report, confidence }) {
  const title = 'High-confidence AI match found';
  const message = `A volunteer report matched ${caseDoc.missingPersonName} with ${confidence}% confidence.`;
  await createNotification({
    recipient: caseDoc.createdBy,
    type: 'ai_match_found',
    title,
    message,
    channels: ['in_app', 'email', 'sms', 'whatsapp'],
    data: { caseId: caseDoc._id, reportId: report._id, confidence }
  });
}

module.exports = { createNotification, triggerEmergencyMatch };

