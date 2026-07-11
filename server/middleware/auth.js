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

function requireVerified(req, res, next) {
  if (req.user?.verified === true) return next();
  return res.status(403).json({
    code: 'email_verification_required',
    error: 'Verify your email to save private Anahata data.',
  });
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
