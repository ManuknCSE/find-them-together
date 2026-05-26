const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const listMine = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json(notifications);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  res.json(notification);
});

module.exports = { listMine, markRead };

