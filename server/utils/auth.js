/**
 * utils/auth.js — legacy alias for backward compatibility
 * Routes that still import '../utils/auth' will resolve correctly.
 * New code should import from '../utils/jwtHelper' directly.
 */
const { signToken, verifyToken } = require('./jwtHelper');

module.exports = { signToken, verifyToken };
