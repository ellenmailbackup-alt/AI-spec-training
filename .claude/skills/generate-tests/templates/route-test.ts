import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/resource', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/resource');
    expect(res.status).toBe(401);
  });

  it('should return resource array', async () => {
    const res = await request(app)
      .get('/api/resource')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
