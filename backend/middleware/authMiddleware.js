const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');
const { isDatabaseAvailable } = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token is missing.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'resumeai-dev-secret';
    const decoded = jwt.verify(token, secret);

    if (isDatabaseAvailable()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found.' });
      }
      req.user = user;
      return next();
    }

    const user = fallbackStore.users.find((entry) => entry._id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session is invalid.' });
    }

    req.user = { ...user, password: undefined };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { protect };
