const express = require('express');
const request = require('supertest');

const mockCollection = {
  getList: jest.fn(),
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPb = {
  collection: jest.fn(() => mockCollection),
};

jest.mock('../services/pbClient', () => mockPb);
jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { userId: 'user_123', email: 'test@example.com' };
    next();
  },
}));

const journalRoutes = require('../routes/journal');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/journal', journalRoutes);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('journal routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists authenticated user journal entries', async () => {
    mockCollection.getList.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 1,
      totalPages: 1,
      items: [{ id: 'entry_1', user_id: 'user_123', entry_type: 'checkin' }],
    });

    const res = await request(buildApp())
      .get('/api/journal?type=checkin&from=2026-01-01&to=2026-01-31')
      .expect(200);

    expect(res.body.entries).toHaveLength(1);
    expect(mockPb.collection).toHaveBeenCalledWith('journal_entries');
    expect(mockCollection.getList).toHaveBeenCalledWith(1, 50, expect.objectContaining({
      sort: '-entry_date,-created',
    }));
    expect(mockCollection.getList.mock.calls[0][2].filter).toContain('user_id = "user_123"');
    expect(mockCollection.getList.mock.calls[0][2].filter).toContain('entry_type = "checkin"');
  });

  test('creates a dated journal entry when none exists', async () => {
    mockCollection.getList.mockResolvedValue({ items: [] });
    mockCollection.create.mockImplementation(async payload => ({ id: 'entry_1', ...payload }));

    const res = await request(buildApp())
      .post('/api/journal')
      .send({
        entry_type: 'daily',
        entry_date: '2026-06-08',
        title: 'Morning pages',
        text: 'A steady start.',
        tags: ['calm', 'focused'],
      })
      .expect(201);

    expect(res.body.entry).toMatchObject({
      id: 'entry_1',
      user_id: 'user_123',
      entry_type: 'daily',
      entry_date: '2026-06-08',
      text: 'A steady start.',
    });
    expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user_123',
      tags: ['calm', 'focused'],
    }));
  });

  test('updates same user/type/date instead of duplicating entries', async () => {
    mockCollection.getList.mockResolvedValue({ items: [{ id: 'entry_1' }] });
    mockCollection.update.mockImplementation(async (id, payload) => ({ id, ...payload }));

    const res = await request(buildApp())
      .post('/api/journal')
      .send({
        type: 'dreams',
        date: '2026-06-08',
        lucidity: 4,
        text: 'A bright hallway and a quiet door.',
      })
      .expect(200);

    expect(res.body.entry).toMatchObject({
      id: 'entry_1',
      entry_type: 'dream',
      lucidity: 4,
    });
    expect(mockCollection.update).toHaveBeenCalledWith('entry_1', expect.objectContaining({
      user_id: 'user_123',
      entry_type: 'dream',
    }));
    expect(mockCollection.create).not.toHaveBeenCalled();
  });

  test('rejects invalid entry payloads', async () => {
    const res = await request(buildApp())
      .post('/api/journal')
      .send({ entry_type: 'unknown', entry_date: '08-06-2026' })
      .expect(400);

    expect(res.body.error).toMatch(/entry_type/);
    expect(mockCollection.create).not.toHaveBeenCalled();
  });
});
