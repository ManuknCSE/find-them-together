const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: {
    type: String,
    enum: ['new_report', 'ai_match_found', 'reward_claimed', 'case_verified', 'nearby_case_alert', 'system'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  channels: [{ type: String, enum: ['email', 'sms', 'whatsapp', 'push', 'in_app'] }],
  data: mongoose.Schema.Types.Mixed,
  readAt: Date,
  deliveredAt: Date
}, { timestamps: true });

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

