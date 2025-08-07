import request from 'supertest';
import app from '../src/app';

describe('Picklist API', () => {
  const apiPrefix = '/api/v1/picklists';

  it('should require auth for getting next assigned picklist', async () => {
    const res = await request(app).get(`${apiPrefix}/assigned/next`);
    expect(res.status).toBe(401);
  });

  it('should require auth for verifying pick', async () => {
    const res = await request(app).post(`${apiPrefix}/verify-pick`).send({});
    expect(res.status).toBe(401);
  });

  it('should require auth for getting picklists', async () => {
    const res = await request(app).get(`${apiPrefix}`);
    expect(res.status).toBe(401);
  });

  it('should require auth for getting picklist by id', async () => {
    const res = await request(app).get(`${apiPrefix}/some-id`);
    expect(res.status).toBe(401);
  });

  it('dummy test to ensure suite runs', () => {
    expect(true).toBe(true);
  });
});