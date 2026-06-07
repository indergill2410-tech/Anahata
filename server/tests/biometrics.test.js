const express = require('express');
const request = require('supertest');

const collections = {};

function makeCollection() {
  return {
    getList: jest.fn(),
    create: jest.fn(),
  };
}

const mockPb = {
  collection: jest.fn(name => {
    if (!collections[name]) collections[name] = makeCollection();
    return collections[name];
  }),
};

jest.mock('../services/pbClient', () => mockPb);
jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user_123', email: 'test@example.com' };
    next();
  },
}));

const biometricsRoutes = require('../routes/biometrics');

function col(name) {
  if (!collections[name]) collections[name] = makeCollection();
  return collections[name];
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/biometrics', biometricsRoutes);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('biometrics routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(collections).forEach(name => {
      Object.values(collections[name]).forEach(fn => fn.mockReset?.());
    });
  });

  test('builds personalized advice from current and recent biometrics', async () => {
    col('biometric_samples').getList.mockResolvedValue({
      items: [
        { heart_rate: 100, source: 'watch', captured_at: '2026-06-08T00:00:00.000Z' },
        { heart_rate: 96, source: 'watch', captured_at: '2026-06-08T00:00:10.000Z' },
        { heart_rate: 92, source: 'watch', captured_at: '2026-06-08T00:00:20.000Z' },
      ],
    });

    const res = await request(buildApp())
      .post('/api/biometrics/advice')
      .send({ source: 'watch', device_name: 'Anahata Band', heart_rate: 116, hrv: 22, battery: 78 })
      .expect(200);

    expect(res.body.advice.metrics.zone.id).toBe('high');
    expect(res.body.advice.breathing.id).toBe('grounding-3-2-7');
    expect(res.body.advice.music.intention).toBe('heal');
    expect(res.body.advice.primaryAction).toMatch(/Ground first/);
  });

  test('saves biometric samples and their generated recommendation', async () => {
    col('biometric_samples').create.mockImplementation(async payload => ({ id: 'sample_1', ...payload }));
    col('biometric_samples').getList.mockResolvedValue({
      items: [
        { id: 'sample_1', user_id: 'user_123', source: 'watch', heart_rate: 92, captured_at: '2026-06-08T00:00:00.000Z' },
        { id: 'sample_0', user_id: 'user_123', source: 'watch', heart_rate: 88, captured_at: '2026-06-08T00:00:10.000Z' },
      ],
    });
    col('biometric_recommendations').create.mockImplementation(async payload => ({ id: 'rec_1', ...payload }));

    const res = await request(buildApp())
      .post('/api/biometrics/samples')
      .send({ source: 'watch', deviceName: 'Anahata Band', heartRate: 92, spo2: 97, battery: 64 })
      .expect(201);

    expect(res.body.sample).toMatchObject({ id: 'sample_1', user_id: 'user_123', heart_rate: 92, source: 'watch' });
    expect(res.body.advice.metrics.heartRate).toBe(92);
    expect(col('biometric_samples').create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user_123',
      device_name: 'Anahata Band',
      heart_rate: 92,
      spo2: 97,
    }));
    expect(col('biometric_recommendations').create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user_123',
      sample_id: 'sample_1',
      breathing_id: expect.any(String),
      music_intention: expect.any(String),
      advice: expect.objectContaining({ primaryAction: expect.any(String) }),
    }));
  });

  test('rejects invalid heart-rate payloads', async () => {
    const res = await request(buildApp())
      .post('/api/biometrics/samples')
      .send({ source: 'watch', heart_rate: 12 })
      .expect(400);

    expect(res.body.error).toMatch(/valid heart_rate/);
    expect(col('biometric_samples').create).not.toHaveBeenCalled();
  });
});
