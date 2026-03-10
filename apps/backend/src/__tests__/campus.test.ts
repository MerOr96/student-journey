import { describe, it, expect } from 'vitest';
import { request } from './helpers';

describe('Campus API — GET /api/campus', () => {
  it('should return a list of campus locations', async () => {
    const res = await request.get('/api/campus');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return locations with correct structure', async () => {
    const res = await request.get('/api/campus');

    if (res.body.data.length > 0) {
      const location = res.body.data[0];
      expect(location.id).toBeDefined();
      expect(location.name).toBeDefined();
      expect(location.name.ru).toBeDefined();
      expect(location.name.tk).toBeDefined();
      expect(location.category).toBeDefined();
      expect(typeof location.latitude).toBe('number');
      expect(typeof location.longitude).toBe('number');
    }
  });

  it('should filter by category', async () => {
    const res = await request.get('/api/campus?category=ACADEMIC');

    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((loc: any) => {
        expect(loc.category).toBe('academic');
      });
    }
  });

  it('should handle lowercase category filter', async () => {
    const res = await request.get('/api/campus?category=dormitory');

    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      res.body.data.forEach((loc: any) => {
        expect(loc.category).toBe('dormitory');
      });
    }
  });

  it('should return all locations for invalid category', async () => {
    const allRes = await request.get('/api/campus');
    const invalidRes = await request.get('/api/campus?category=INVALID');

    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body.data.length).toBe(allRes.body.data.length);
  });
});
