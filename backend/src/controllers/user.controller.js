const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const updateMyLocation = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    location: {
      type: 'Point',
      coordinates: req.body.coordinates,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country
    }
  }, { new: true });
  res.json(user);
});

module.exports = { me, updateMyLocation };

