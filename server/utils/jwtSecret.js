const DEFAULT_DEV_SECRET = 'anahata-dev-secret-change-in-production';

function isUnsafeJwtSecret(secret) {
  if (!secret) return true;
  const value = String(secret);
  return (
    value === DEFAULT_DEV_SECRET ||
    /change-(me|in-production)/i.test(value) ||
    /dev-secret/i.test(value) ||
    value.length < 32
  );
}

function getJwtSecret() {
  const configured = process.env.JWT_SECRET;
  const secret = configured || (process.env.NODE_ENV === 'production' ? '' : DEFAULT_DEV_SECRET);

  if (process.env.NODE_ENV === 'production' && isUnsafeJwtSecret(secret)) {
    throw new Error('JWT_SECRET must be a strong production secret.');
  }

  return secret;
}

module.exports = { DEFAULT_DEV_SECRET, getJwtSecret, isUnsafeJwtSecret };
