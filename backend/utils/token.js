const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'resumeai-dev-secret', {
    expiresIn: '7d',
  });
};

module.exports = { generateToken };
