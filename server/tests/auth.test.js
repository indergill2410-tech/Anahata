const { signToken, verifyToken } = require('../utils/jwtHelper');
const { DEFAULT_DEV_SECRET, getJwtSecret, isUnsafeJwtSecret } = require('../utils/jwtSecret');

describe('JWT helpers', () => {
  test('signs and verifies a token', () => {
    const payload = { userId: 'abc123', email: 'test@anahata.app' };
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('abc123');
    expect(decoded.email).toBe('test@anahata.app');
  });

  test('throws on tampered token', () => {
    const token = signToken({ userId: 'x' });
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('throws on expired token', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ userId: 'x' }, process.env.JWT_SECRET || 'anahata-dev-secret-change-in-production',
      { expiresIn: '-1s', issuer: 'anahata' });
    expect(() => verifyToken(expired)).toThrow(/expired/);
  });

  test('marks development and short secrets as unsafe for production', () => {
    expect(isUnsafeJwtSecret(DEFAULT_DEV_SECRET)).toBe(true);
    expect(isUnsafeJwtSecret('short')).toBe(true);
    expect(isUnsafeJwtSecret('a-strong-production-secret-with-enough-length')).toBe(false);
  });

  test('refuses unsafe secrets in production', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = DEFAULT_DEV_SECRET;
      expect(() => getJwtSecret()).toThrow(/production secret/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    }
  });
});
