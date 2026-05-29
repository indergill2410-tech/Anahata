/**
 * Anahata — JWT Utilities
 */

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'anahata_dev_secret_change_in_production';

function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
