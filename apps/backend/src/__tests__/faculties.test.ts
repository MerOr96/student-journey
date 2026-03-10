import { describe, it, expect } from 'vitest';
import { request, getAuthHeader } from './helpers';

describe('Faculties API — GET /api/faculties', () => {
  it('should return a list of faculties', async () => {
    const res = await request.get('/api/faculties');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return faculties with correct structure', async () => {
    const res = await request.get('/api/faculties');

    const faculty = res.body.data[0];
    expect(faculty.id).toBeDefined();
    expect(faculty.slug).toBeDefined();
    expect(faculty.name.ru).toBeDefined();
    expect(faculty.name.tk).toBeDefined();
    expect(faculty.description.ru).toBeDefined();
    expect(faculty.tuitionPerYear).toBeDefined();
    expect(faculty.durationYears).toBeDefined();
  });
});

describe('Faculties API — GET /api/faculties/:slug', () => {
  it('should return a specific faculty by slug', async () => {
    // First get the list to find a valid slug
    const listRes = await request.get('/api/faculties');
    const slug = listRes.body.data[0].slug;

    const res = await request.get(`/api/faculties/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(slug);
  });

  it('should return 404 for nonexistent faculty', async () => {
    const res = await request.get('/api/faculties/nonexistent-faculty');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Faculties API — POST /api/faculties/choose', () => {
  it('should choose a faculty for authenticated user', async () => {
    const auth = await getAuthHeader();
    const listRes = await request.get('/api/faculties');
    const slug = listRes.body.data[0].slug;

    const res = await request
      .post('/api/faculties/choose')
      .set('Authorization', auth.authorization)
      .send({ facultySlug: slug });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.faculty.slug).toBe(slug);
  });

  it('should reject choosing faculty without auth', async () => {
    const res = await request
      .post('/api/faculties/choose')
      .send({ facultySlug: 'some-slug' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject choosing nonexistent faculty', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/faculties/choose')
      .set('Authorization', auth.authorization)
      .send({ facultySlug: 'nonexistent-slug' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing facultySlug', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/faculties/choose')
      .set('Authorization', auth.authorization)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
