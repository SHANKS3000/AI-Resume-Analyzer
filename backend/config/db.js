const mongoose = require('mongoose');
const fallbackStore = require('../utils/fallbackStore');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeai';

  if (!uri || uri.includes('your_mongodb_uri')) {
    fallbackStore.dbAvailable = false;
    console.warn('MongoDB URI is not configured. Falling back to in-memory storage for demo mode.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully.');
    fallbackStore.dbAvailable = true;
    return true;
  } catch (error) {
    fallbackStore.dbAvailable = false;
    console.warn('MongoDB connection failed. Switching to fallback mode:', error.message);
    return false;
  }
};

const isDatabaseAvailable = () => {
  return mongoose.connection.readyState === 1 || fallbackStore.dbAvailable;
};

module.exports = {
  connectDB,
  isDatabaseAvailable,
};
