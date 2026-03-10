import { describe, it, expect } from 'vitest';
import { request, getAuthHeader } from './helpers';
import { prisma } from '../test/setup';

/**
 * Helper: create an admin user directly in the DB and get auth token.
 */
async function getAdminAuthHeader() {
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');

  const email = `admin-${Date.now()}@test.com`;
  const passwordHash = await bcrypt.hash('AdminPass1', 12);

  const adminUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: 'Test Admin',
      role: 'ADMIN',
      language: 'RU',
    },
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me-in-production';
  const accessToken = jwt.sign(
    { userId: adminUser.id, role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    authorization: `Bearer ${accessToken}`,
    user: adminUser,
  };
}

describe('Admin API — GET /api/admin/stats', () => {
  it('should return stats for admin user', async () => {
    const admin = await getAdminAuthHeader();

    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', admin.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalStudents).toBeDefined();
    expect(typeof res.body.data.totalStudents).toBe('number');
    expect(res.body.data.newThisWeek).toBeDefined();
    expect(res.body.data.documentsSubmitted).toBeDefined();
    expect(res.body.data.accepted).toBeDefined();
    expect(res.body.data.averageXp).toBeDefined();
    expect(Array.isArray(res.body.data.topReferrers)).toBe(true);
  });

  it('should reject request without authentication', async () => {
    const res = await request.get('/api/admin/stats');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject request from non-admin user (403)', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('Admin API — GET /api/admin/students', () => {
  it('should return paginated student list for admin', async () => {
    const admin = await getAdminAuthHeader();

    // Create a test student first
    await getAuthHeader({ fullName: 'Student For Admin Test' });

    const res = await request
      .get('/api/admin/students')
      .set('Authorization', admin.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.total).toBeDefined();
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.pageSize).toBeDefined();
    expect(res.body.data.totalPages).toBeDefined();
  });

  it('should support pagination parameters', async () => {
    const admin = await getAdminAuthHeader();

    const res = await request
      .get('/api/admin/students?page=1&pageSize=5')
      .set('Authorization', admin.authorization);

    expect(res.status).toBe(200);
    expect(res.body.data.pageSize).toBe(5);
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
  });

  it('should support search by name', async () => {
    const admin = await getAdminAuthHeader();
    await getAuthHeader({ fullName: 'UniqueSearchableName' });

    const res = await request
      .get('/api/admin/students?search=UniqueSearchableName')
      .set('Authorization', admin.authorization);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.items.some((s: any) => s.fullName.includes('UniqueSearchableName'))
    ).toBe(true);
  });

  it('should reject non-admin user', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .get('/api/admin/students')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(403);
  });
});
