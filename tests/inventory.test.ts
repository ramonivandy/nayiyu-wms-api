import request from 'supertest';
import app from '../src/app';

describe('Inventory API', () => {
  const apiPrefix = '/api/v1/inventory';

  it('should require auth for creating adjustment', async () => {
    const res = await request(app).post(`${apiPrefix}/adjustments`).send({});
    expect(res.status).toBe(401);
  });

  it('should require auth for getting adjustment history', async () => {
    const res = await request(app).get(`${apiPrefix}/adjustments`);
    expect(res.status).toBe(401);
  });

  it('should require auth for getting inventory levels', async () => {
    const res = await request(app).get(`${apiPrefix}/levels`);
    expect(res.status).toBe(401);
  });

  it('dummy test to ensure suite runs', () => {
    expect(true).toBe(true);
  });
});