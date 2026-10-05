const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');
const { isDatabaseAvailable } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.status(200).json({ success: true, user });
    }

    const user = fallbackStore.users.find((entry) => entry._id === req.user._id.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ success: false, message: 'No profile data was provided.' });
    }

    if (isDatabaseAvailable()) {
      const updated = await User.findByIdAndUpdate(
        req.user._id,
        { name, email },
        { new: true, runValidators: true }
      ).select('-password');

      return res.status(200).json({ success: true, user: updated });
    }

    const index = fallbackStore.users.findIndex((entry) => entry._id === req.user._id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    fallbackStore.users[index] = {
      ...fallbackStore.users[index],
      ...(name ? { name } : {}),
      ...(email ? { email: email.toLowerCase() } : {}),
    };

    return res.status(200).json({
      success: true,
      user: {
        _id: fallbackStore.users[index]._id,
        name: fallbackStore.users[index].name,
        email: fallbackStore.users[index].email,
        createdAt: fallbackStore.users[index].createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
};

module.exports = { getProfile, updateProfile };
