const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET || 'anahata-dev-secret-change-in-production';
const EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES, issuer: 'anahata' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET, { issuer: 'anahata' });
}

module.exports = { signToken, verifyToken };
