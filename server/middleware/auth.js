const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');

/**
 * requireAuth — Express middleware
 * Validates Bearer JWT and attaches decoded payload to req.user
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * requireVerified — retained as a pass-through.
 *
 * Email verification has been removed, so this no longer blocks anyone; any
 * authenticated user may write. It stays in the middleware chain (and exported)
 * so routes and tests need no changes, and enforcement can be reinstated here
 * alone if the dormant `verified` field is ever put back to use.
 */
function requireVerified(req, res, next) {
  return next();
}

/**
 * optionalAuth — attaches user if token present, continues regardless
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], getJwtSecret());
    } catch {}
  }
  next();
}

module.exports = { requireAuth, requireVerified, optionalAuth };
