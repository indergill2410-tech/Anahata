const { signToken, verifyToken } = require('../utils/jwtHelper');

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
});
