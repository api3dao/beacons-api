import { Client } from 'pg';
import { initDb } from 'src/database';

jest.mock('pg', () => {
  const db = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => db) };
});

describe('Database initialization', () => {
  let db: any;
  beforeEach(() => {
    db = new Client();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should success', async () => {
    db.query.mockResolvedValueOnce({ rows: [{'?column?': 1}], rowCount: 1 });
    await initDb();
    expect(db.connect).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith('select 1;');
  });
})