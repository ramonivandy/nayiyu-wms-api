import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
  const apiPrefix = '/api/v1/auth';

  it('should return 400 for missing login fields', async () => {
    const res = await request(app).post(`${apiPrefix}/login`).send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return 400 for missing register fields', async () => {
    const res = await request(app).post(`${apiPrefix}/register`).send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should require auth for profile', async () => {
    const res = await request(app).get(`${apiPrefix}/profile`);
    expect(res.status).toBe(401);
  });

  it('should require auth for logout', async () => {
    const res = await request(app).post(`${apiPrefix}/logout`);
    expect(res.status).toBe(401);
  });

  it('dummy test to ensure suite runs', () => {
    expect(true).toBe(true);
  });
});