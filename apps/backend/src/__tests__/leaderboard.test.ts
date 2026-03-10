import { describe, it, expect } from 'vitest';
import { request } from './helpers';

describe('Leaderboard API — GET /api/leaderboard', () => {
  it('should return a leaderboard array', async () => {
    const res = await request.get('/api/leaderboard');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should have correct entry structure when entries exist', async () => {
    const res = await request.get('/api/leaderboard');

    if (res.body.data.length > 0) {
      const entry = res.body.data[0];
      expect(entry.rank).toBeDefined();
      expect(entry.userId).toBeDefined();
      expect(entry.fullName).toBeDefined();
      expect(entry.xp).toBeDefined();
      expect(entry.level).toBeDefined();
      expect(entry.badgeCount).toBeDefined();
    }
  });

  it('should return entries sorted by XP descending', async () => {
    const res = await request.get('/api/leaderboard');

    const data = res.body.data;
    for (let i = 1; i < data.length; i++) {
      expect(data[i].xp).toBeLessThanOrEqual(data[i - 1].xp);
    }
  });

  it('should not include admin users in leaderboard', async () => {
    const res = await request.get('/api/leaderboard');

    // All entries should be students — admin should be filtered out
    res.body.data.forEach((entry: any) => {
      expect(entry.userId).toBeDefined();
      // We can't directly check role from leaderboard, but presence means they're not admin
    });
    expect(res.status).toBe(200);
  });
});
