/**
 * authenticate.js — legacy alias for backward compatibility
 * Routes that still import '../middleware/authenticate' will work correctly.
 * New code should import from '../middleware/auth' directly.
 */
const { requireAuth, optionalAuth } = require('./auth');

// authenticate is an alias for requireAuth
const authenticate = requireAuth;

module.exports = { authenticate, requireAuth, optionalAuth };
