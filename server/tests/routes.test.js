const request = require('supertest');
const app     = require('../app');

describe('GET /health', () => {
  it('returns 200 healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toBe('Anahata');
  });
});

describe('GET /api/library', () => {
  it('returns tracks array with pagination', async () => {
    const res = await request(app).get('/api/library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tracks)).toBe(true);
    expect(res.body.tracks.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(111);
  });

  it('filters by brainwave', async () => {
    const res = await request(app).get('/api/library?brainwave=Theta');
    expect(res.statusCode).toBe(200);
    res.body.tracks.forEach(t => expect(t.brainwave).toBe('Theta'));
  });

  it('returns categories with counts', async () => {
    const res = await request(app).get('/api/library/categories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(111);
  });
});

describe('POST /api/meditation/analyze', () => {
  it('analyzes valid heart rate', async () => {
    const res = await request(app)
      .post('/api/meditation/analyze')
      .send({ heartRate: 75 });
    expect(res.statusCode).toBe(200);
    expect(res.body.brainwaveState).toBeDefined();
    expect(res.body.binauralHz).toBeDefined();
  });

  it('rejects missing heart rate', async () => {
    const res = await request(app)
      .post('/api/meditation/analyze')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});
