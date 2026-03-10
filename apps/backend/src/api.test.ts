import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

const app = createApp();

async function registerUser(overrides?: Partial<{ email: string; password: string; fullName: string }>) {
  const email = overrides?.email ?? `user${Date.now()}@example.com`;
  const password = overrides?.password ?? 'password123';
  const fullName = overrides?.fullName ?? 'Test User';

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, fullName, language: 'RU' });

  return { res, email, password, fullName };
}

describe('API smoke', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('Auth', () => {
  it('registers a new user and returns tokens + user', async () => {
    const { res, email, fullName } = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.accessToken).toBeTypeOf('string');
    expect(res.body?.data?.refreshToken).toBeTypeOf('string');
    expect(res.body?.data?.user?.email).toBe(email);
    expect(res.body?.data?.user?.fullName).toBe(fullName);
  });

  it('rejects duplicate registration (same email)', async () => {
    const first = await registerUser({ email: 'dup@example.com' });
    expect(first.res.status).toBe(201);

    const second = await registerUser({ email: 'dup@example.com' });
    expect(second.res.status).toBe(409);
    expect(second.res.body?.success).toBe(false);
  });

  it('logs in and returns tokens + user', async () => {
    const { email, password } = await registerUser();

    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.accessToken).toBeTypeOf('string');
    expect(res.body?.data?.refreshToken).toBeTypeOf('string');
    expect(res.body?.data?.user?.email).toBe(email);
  });

  it('GET /api/auth/me requires bearer token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me works with token', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.data.accessToken as string;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.email).toBe(reg.body.data.user.email);
  });
});

describe('Admin access control', () => {
  it('blocks non-admin user from /api/admin/stats', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.data.accessToken as string;

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body?.success).toBe(false);
  });

  it('allows admin user to access /api/admin/stats', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ulsu.ru', password: 'admin123' });

    expect(res.status).toBe(200);
    const token = res.body.data.accessToken as string;

    const stats = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body?.success).toBe(true);
    expect(stats.body?.data).toHaveProperty('totalStudents');
  });
});

describe('Quests', () => {
  it('allows completing a beginner quest once, then blocks повторное выполнение', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.data.accessToken as string;

    const first = await request(app)
      .post('/api/quests/fill_personal_info/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(first.body?.success).toBe(true);
    expect(first.body?.data?.questSlug).toBe('fill_personal_info');
    expect(first.body?.data?.xpAwarded).toBe(30);

    const second = await request(app)
      .post('/api/quests/fill_personal_info/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(second.status).toBe(400);
    expect(second.body?.success).toBe(false);
  });
});

describe('Documents', () => {
  it('uploads passport PDF and auto-completes related quest', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.data.accessToken as string;

    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n', 'utf8');

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'PASSPORT')
      .attach('file', pdf, { filename: 'passport.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.document?.type).toBe('passport');
    expect(res.body?.data?.document?.status).toBe('pending');
    expect(res.body?.data?.document?.fileUrl).toMatch(/^\/uploads\//);

    expect(res.body?.data?.questCompleted?.questSlug).toBe('upload_passport');
    expect(res.body?.data?.questCompleted?.xpAwarded).toBe(50);
    expect(res.body?.data?.questCompleted?.newXp).toBe(50);
  });
});

