const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPersonCase', required: true, index: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerReport' },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending', index: true },
  notes: String,
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);

