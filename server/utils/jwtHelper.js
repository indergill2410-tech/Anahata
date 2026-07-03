const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwtSecret');

const EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: EXPIRES, issuer: 'anahata' });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { issuer: 'anahata' });
}

module.exports = { signToken, verifyToken };
