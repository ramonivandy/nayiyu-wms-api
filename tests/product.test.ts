import request from 'supertest';
import app from '../src/app';

describe('Products & BOM API', () => {
  const base = '/api/v1';

  it('should require auth for products endpoints', async () => {
    expect((await request(app).get(`${base}/products`)).status).toBe(401);
    expect((await request(app).post(`${base}/products`).send({})).status).toBe(401);
  });
});