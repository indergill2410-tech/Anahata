const express = require('express');
const request = require('supertest');
const { signToken, verifyToken } = require('../utils/jwtHelper');

const mockCollection = {
  getOne: jest.fn(),
  getList: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  requestVerification: jest.fn(),
  confirmVerification: jest.fn(),
};

const mockPb = {
  collection: jest.fn(() => mockCollection),
};

jest.mock('../services/pbClient', () => mockPb);

const authRoutes = require('../routes/auth');
const journalRoutes = require('../routes/journal');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/journal', journalRoutes);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('auth verification gates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('refreshes the session with verified user state', async () => {
    mockCollection.getOne.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test',
      verified: true,
    });

    const token = signToken({ userId: 'user_123', email: 'test@example.com', name: 'Test', verified: false });
    const res = await request(buildApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toMatchObject({ id: 'user_123', verified: true });
    expect(verifyToken(res.body.token).verified).toBe(true);
  });

  test('removes the email-verification endpoints', async () => {
    const token = signToken({ userId: 'user_123', email: 'test@example.com', name: 'Test', verified: false });

    await request(buildApp())
      .post('/api/auth/verification/request')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(buildApp())
      .post('/api/auth/verification/confirm')
      .send({ token: 'verify-token' })
      .expect(404);

    expect(mockCollection.requestVerification).not.toHaveBeenCalled();
    expect(mockCollection.confirmVerification).not.toHaveBeenCalled();
  });

  test('allows private journal writes without email verification', async () => {
    mockCollection.create.mockResolvedValue({
      id: 'entry_1', entry_type: 'note', entry_date: '2026-06-08', text: 'A private signal.',
    });
    const token = signToken({ userId: 'user_123', email: 'test@example.com', name: 'Test', verified: false });

    const res = await request(buildApp())
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ entry_type: 'note', entry_date: '2026-06-08', text: 'A private signal.' })
      .expect(201);

    expect(res.body.entry).toMatchObject({ id: 'entry_1' });
    expect(mockCollection.create).toHaveBeenCalled();
  });
});
