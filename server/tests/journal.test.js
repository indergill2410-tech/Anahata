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

  test('creates a dated journal entry', async () => {
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

  test('creates multiple entries for the same user/type/date', async () => {
    mockCollection.create
      .mockImplementationOnce(async payload => ({ id: 'entry_1', ...payload }))
      .mockImplementationOnce(async payload => ({ id: 'entry_2', ...payload }));

    await request(buildApp())
      .post('/api/journal')
      .send({
        type: 'dreams',
        date: '2026-06-08',
        lucidity: 4,
        text: 'A bright hallway and a quiet door.',
      })
      .expect(201);

    const res = await request(buildApp())
      .post('/api/journal')
      .send({
        type: 'dreams',
        date: '2026-06-08',
        lucidity: 2,
        text: 'A second signal from the same night.',
      })
      .expect(201);

    expect(res.body.entry).toMatchObject({
      id: 'entry_2',
      entry_type: 'dream',
      lucidity: 2,
    });
    expect(mockCollection.create).toHaveBeenCalledTimes(2);
    expect(mockCollection.create).toHaveBeenLastCalledWith(expect.objectContaining({
      user_id: 'user_123',
      entry_type: 'dream',
    }));
    expect(mockCollection.update).not.toHaveBeenCalled();
  });

  test('creates notes and plans as journal entries', async () => {
    mockCollection.create.mockImplementation(async payload => ({ id: 'entry_1', ...payload }));

    await request(buildApp())
      .post('/api/journal')
      .send({
        entry_type: 'note',
        entry_date: '2026-06-08',
        title: 'Field note',
        text: 'A quick signal.',
      })
      .expect(201);

    const res = await request(buildApp())
      .post('/api/journal')
      .send({
        entry_type: 'plan',
        entry_date: '2026-06-08',
        title: 'Flight path',
        text: 'Meditate, write, rest.',
        metadata: { status: 'active', checklist: ['meditate', 'write'] },
      })
      .expect(201);

    expect(res.body.entry).toMatchObject({
      entry_type: 'plan',
      metadata: { status: 'active', checklist: ['meditate', 'write'] },
    });
  });

  test('rejects invalid entry payloads', async () => {
    const res = await request(buildApp())
      .post('/api/journal')
      .send({ entry_type: 'unknown', entry_date: '08-06-2026' })
      .expect(400);

    expect(res.body.error).toMatch(/entry_type/);
    expect(mockCollection.create).not.toHaveBeenCalled();
  });

  test('exports only the authenticated user journal entries', async () => {
    mockCollection.getList.mockResolvedValue({
      page: 1,
      perPage: 100,
      totalItems: 2,
      totalPages: 1,
      items: [
        { id: 'entry_1', user_id: 'user_123', entry_type: 'checkin' },
        { id: 'entry_2', user_id: 'user_123', entry_type: 'dream' },
      ],
    });

    const res = await request(buildApp())
      .get('/api/journal/export')
      .expect(200);

    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.count).toBe(2);
    expect(res.body.entries).toHaveLength(2);
    expect(mockCollection.getList.mock.calls[0][2].filter).toBe('user_id = "user_123"');
  });

  test('clears only the authenticated user journal entries', async () => {
    mockCollection.getList.mockResolvedValue({
      page: 1,
      perPage: 100,
      totalItems: 2,
      totalPages: 1,
      items: [
        { id: 'entry_1', user_id: 'user_123' },
        { id: 'entry_2', user_id: 'user_123' },
      ],
    });
    mockCollection.delete.mockResolvedValue({});

    const res = await request(buildApp())
      .delete('/api/journal')
      .expect(200);

    expect(res.body.deleted).toBe(2);
    expect(mockCollection.getList.mock.calls[0][2].filter).toBe('user_id = "user_123"');
    expect(mockCollection.delete).toHaveBeenCalledWith('entry_1');
    expect(mockCollection.delete).toHaveBeenCalledWith('entry_2');
  });

  test('does not return or delete an entry owned by another user', async () => {
    mockCollection.getOne.mockResolvedValue({ id: 'entry_other', user_id: 'someone_else' });

    await request(buildApp())
      .get('/api/journal/entry_other')
      .expect(404);

    await request(buildApp())
      .delete('/api/journal/entry_other')
      .expect(404);

    expect(mockCollection.delete).not.toHaveBeenCalled();
  });
});
