const { signToken, verifyToken } = require('../utils/auth');

describe('JWT utils', () => {
  test('signs and verifies a valid token', () => {
    const token = signToken({ userId: 'abc123', email: 'test@test.com' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('abc123');
    expect(decoded.email).toBe('test@test.com');
  });

  test('throws on invalid token', () => {
    expect(() => verifyToken('bad.token.here')).toThrow();
  });

  test('throws on expired token', () => {
    const token = signToken({ userId: 'x' }, '-1s');
    expect(() => verifyToken(token)).toThrow();
  });
});
