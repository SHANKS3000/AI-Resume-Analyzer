const bcrypt = require('bcryptjs');
const User = require('../models/User');
const fallbackStore = require('../utils/fallbackStore');
const { generateToken } = require('../utils/token');
const { isDatabaseAvailable } = require('../config/db');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt || new Date().toISOString(),
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (isDatabaseAvailable()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email: email.toLowerCase(), password: passwordHash });
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: sanitizeUser(user),
      });
    }

    const existingUser = fallbackStore.users.find((entry) => entry.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      _id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      createdAt: new Date().toISOString(),
    };

    fallbackStore.users.push(newUser);
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to create the account right now.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (isDatabaseAvailable()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        token,
        user: sanitizeUser(user),
      });
    }

    const user = fallbackStore.users.find((entry) => entry.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to login right now.' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: sanitizeUser(req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch user profile.' });
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };
