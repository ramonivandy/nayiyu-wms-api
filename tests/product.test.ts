import request from 'supertest';
import app from '../src/app';

describe('Product API', () => {
  const apiPrefix = '/api/v1/products';

  it('should require auth for product list', async () => {
    const res = await request(app).get(`${apiPrefix}`);
    expect(res.status).toBe(401);
  });

  it('should require auth for product details', async () => {
    const res = await request(app).get(`${apiPrefix}/some-id`);
    expect(res.status).toBe(401);
  });

  it('dummy test to ensure suite runs', () => {
    expect(true).toBe(true);
  });
});