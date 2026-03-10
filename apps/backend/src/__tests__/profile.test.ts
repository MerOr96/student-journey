import { describe, it, expect } from 'vitest';
import { request, getAuthHeader } from './helpers';

describe('Profile API — GET /api/profile', () => {
  it('should return player profile for authenticated user', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .get('/api/profile')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xp).toBe(0);
    expect(res.body.data.level).toBe('beginner');
    expect(res.body.data.completedQuests).toEqual([]);
    expect(res.body.data.badges).toEqual([]);
    expect(res.body.data.referralCode).toBeDefined();
    // New fields from functionality improvements
    expect(res.body.data.overallProgress).toBe(0);
    expect(res.body.data.xpProgress).toBe(0);
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('should reject request without authentication', async () => {
    const res = await request.get('/api/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Profile API — PUT /api/profile', () => {
  it('should update fullName successfully', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .put('/api/profile')
      .set('Authorization', auth.authorization)
      .send({ fullName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Updated Name');
  });

  it('should update phone successfully', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .put('/api/profile')
      .set('Authorization', auth.authorization)
      .send({ phone: '+7-999-111-22-33' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('+7-999-111-22-33');
  });

  it('should reject too short fullName', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .put('/api/profile')
      .set('Authorization', auth.authorization)
      .send({ fullName: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ─── BUG TEST: lowercase language should be accepted ──────────
  it('should accept lowercase language value "ru"', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .put('/api/profile')
      .set('Authorization', auth.authorization)
      .send({ language: 'ru' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.language).toBe('ru');
  });

  // ─── BUG TEST: lowercase language "tk" should be accepted ─────
  it('should accept lowercase language value "tk"', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .put('/api/profile')
      .set('Authorization', auth.authorization)
      .send({ language: 'tk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.language).toBe('tk');
  });
});
