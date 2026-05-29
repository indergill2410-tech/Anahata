const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('returns 200 with healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toBe('Anahata');
  });
});

describe('POST /api/meditation/analyze', () => {
  it('returns 400 for missing heartRate', async () => {
    const res = await request(app).post('/api/meditation/analyze').send({});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for out-of-range heartRate', async () => {
    const res = await request(app).post('/api/meditation/analyze').send({ heartRate: 250 });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/sessions (unauthenticated)', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.statusCode).toBe(401);
  });
});
