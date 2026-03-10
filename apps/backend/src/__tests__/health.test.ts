import { describe, it, expect } from 'vitest';
import { request } from './helpers';

describe('Health API — GET /api/health', () => {
  it('should return status ok', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return a valid timestamp', async () => {
    const res = await request.get('/api/health');

    expect(res.body.timestamp).toBeDefined();
    const date = new Date(res.body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  // ─── BUG TEST: health should include version field ────────────
  it('should include version field in response', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.version).toBeDefined();
    expect(typeof res.body.version).toBe('string');
  });

  // ─── BUG TEST: health should include uptime field ─────────────
  it('should include uptime field in response', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.uptime).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
