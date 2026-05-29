const request = require('supertest');
const app     = require('../app');

describe('GET /health', () => {
  it('returns 200 with app name', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toBe('Anahata');
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.api).toBe('ok');
  });
});

describe('GET /api/library', () => {
  it('returns tracks with pagination', async () => {
    const res = await request(app).get('/api/library');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tracks)).toBe(true);
    expect(res.body.tracks.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(100);
  });

  it('filters by brainwave', async () => {
    const res = await request(app).get('/api/library?brainwave=Theta');
    expect(res.statusCode).toBe(200);
    res.body.tracks.forEach(t => expect(t.brainwave).toBe('Theta'));
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/library?category=Binaural+Beats');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tracks)).toBe(true);
  });

  it('searches by keyword', async () => {
    const res = await request(app).get('/api/library?search=sitar');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tracks)).toBe(true);
  });

  it('paginates correctly', async () => {
    const res = await request(app).get('/api/library?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.tracks.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination.limit).toBe(5);
  });

  it('returns categories with counts', async () => {
    const res = await request(app).get('/api/library/categories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(100);
  });

  it('returns recommendations', async () => {
    const res = await request(app).get('/api/library/recommend?heartRate=85&brainwave=Theta');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.recommended)).toBe(true);
    expect(res.body.recommended.length).toBeGreaterThan(0);
  });

  it('returns a single track by id', async () => {
    const all = await request(app).get('/api/library?limit=1');
    const id = all.body.tracks[0].id;
    const res = await request(app).get(`/api/library/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.track.id).toBe(id);
  });

  it('returns 404 for unknown track id', async () => {
    const res = await request(app).get('/api/library/nonexistent-track-id');
    expect(res.statusCode).toBe(404);
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
    expect(res.body.targetHeartRate).toBeDefined();
  });

  it('analyzes with optional hrv and spo2', async () => {
    const res = await request(app)
      .post('/api/meditation/analyze')
      .send({ heartRate: 80, hrv: 45, spo2: 98 });
    expect(res.statusCode).toBe(200);
    expect(res.body.brainwaveState).toBeDefined();
  });

  it('rejects missing heart rate', async () => {
    const res = await request(app).post('/api/meditation/analyze').send({});
    expect(res.statusCode).toBe(400);
  });

  it('rejects out-of-range heart rate', async () => {
    const res = await request(app).post('/api/meditation/analyze').send({ heartRate: 300 });
    expect(res.statusCode).toBe(400);
  });
});

describe('Auth routes', () => {
  it('rejects login with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects register with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com', password: '123', name: 'Test'
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects register with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'notanemail', password: 'password123', name: 'Test'
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 for /me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for logout without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(401);
  });
});

describe('Session routes (unauthenticated)', () => {
  it('returns 401 for session list without token', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for session stats without token', async () => {
    const res = await request(app).get('/api/sessions/stats');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for session post without token', async () => {
    const res = await request(app).post('/api/sessions').send({ heart_rate: 75 });
    expect(res.statusCode).toBe(401);
  });
});

describe('Profile routes (unauthenticated)', () => {
  it('returns 401 for GET /api/profile without token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for PUT /api/profile without token', async () => {
    const res = await request(app).put('/api/profile').send({ name: 'Test' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Library favourites (unauthenticated)', () => {
  it('returns 401 for GET /api/library/favourites without token', async () => {
    const res = await request(app).get('/api/library/favourites');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for POST /api/library/plays without token', async () => {
    const res = await request(app).post('/api/library/plays').send({ track_id: 'abc' });
    expect(res.statusCode).toBe(401);
  });
});
