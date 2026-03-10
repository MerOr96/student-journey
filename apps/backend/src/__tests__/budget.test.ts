import { describe, it, expect } from 'vitest';
import { request, getAuthHeader } from './helpers';

describe('Budget API — POST /api/budget/calculate', () => {
  it('should calculate budget for valid input', async () => {
    const auth = await getAuthHeader();

    // First get a valid faculty slug
    const faculties = await request.get('/api/faculties');
    const slug = faculties.body.data[0].slug;

    const res = await request
      .post('/api/budget/calculate')
      .set('Authorization', auth.authorization)
      .send({
        facultySlug: slug,
        dormitory: true,
        mealPlan: 'standard',
        insuranceIncluded: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.breakdown).toBeDefined();
    expect(res.body.data.breakdown.tuition).toBeGreaterThan(0);
    expect(res.body.data.breakdown.dormitory).toBeGreaterThan(0);
    expect(res.body.data.breakdown.meals).toBeGreaterThan(0);
    expect(res.body.data.breakdown.insurance).toBeGreaterThan(0);
    expect(res.body.data.breakdown.totalFirstYear).toBeGreaterThan(0);
    expect(res.body.data.breakdown.currency).toBe('RUB');
  });

  it('should reject request without authentication', async () => {
    const res = await request.post('/api/budget/calculate').send({
      facultySlug: 'any',
      dormitory: true,
      mealPlan: 'basic',
      insuranceIncluded: false,
    });

    expect(res.status).toBe(401);
  });

  it('should reject invalid meal plan', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/budget/calculate')
      .set('Authorization', auth.authorization)
      .send({
        facultySlug: 'test',
        dormitory: true,
        mealPlan: 'ultra-premium',
        insuranceIncluded: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing required fields', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/budget/calculate')
      .set('Authorization', auth.authorization)
      .send({ facultySlug: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for nonexistent faculty', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/budget/calculate')
      .set('Authorization', auth.authorization)
      .send({
        facultySlug: 'nonexistent-faculty-slug',
        dormitory: false,
        mealPlan: 'basic',
        insuranceIncluded: false,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
