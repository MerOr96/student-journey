import { describe, it, expect } from 'vitest';
import { request, registerUser, getAuthHeader } from './helpers';

describe('Auth API — POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request.post('/api/auth/register').send({
      email: `reg-${Date.now()}@test.com`,
      password: 'StrongPass1',
      fullName: 'Test Registrant',
      language: 'RU',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toContain('@test.com');
    expect(res.body.data.user.role).toBe('student');
  });

  it('should reject registration with invalid email', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'StrongPass1',
      fullName: 'Test User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with short password', async () => {
    const res = await request.post('/api/auth/register').send({
      email: `short-${Date.now()}@test.com`,
      password: '12',
      fullName: 'Test User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with short fullName', async () => {
    const res = await request.post('/api/auth/register').send({
      email: `name-${Date.now()}@test.com`,
      password: 'StrongPass1',
      fullName: 'A',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject duplicate email registration', async () => {
    const email = `dup-${Date.now()}@test.com`;

    await request.post('/api/auth/register').send({
      email,
      password: 'StrongPass1',
      fullName: 'First User',
    });

    const res = await request.post('/api/auth/register').send({
      email,
      password: 'AnotherPass1',
      fullName: 'Second User',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should accept lowercase language and normalize it', async () => {
    const res = await request.post('/api/auth/register').send({
      email: `lang-${Date.now()}@test.com`,
      password: 'StrongPass1',
      fullName: 'Turkmen User',
      language: 'tk',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.language).toBe('tk');
  });
});

describe('Auth API — POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const email = `login-${Date.now()}@test.com`;
    await request.post('/api/auth/register').send({
      email,
      password: 'LoginPass1',
      fullName: 'Login User',
    });

    const res = await request.post('/api/auth/login').send({
      email,
      password: 'LoginPass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
  });

  it('should reject login with wrong password', async () => {
    const email = `wrongpass-${Date.now()}@test.com`;
    await request.post('/api/auth/register').send({
      email,
      password: 'CorrectPass1',
      fullName: 'User',
    });

    const res = await request.post('/api/auth/login').send({
      email,
      password: 'WrongPass999',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with nonexistent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nonexistent@nowhere.com',
      password: 'SomePass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with empty password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'some@email.com',
      password: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth API — POST /api/auth/refresh', () => {
  it('should return new access token with valid refresh token', async () => {
    const auth = await getAuthHeader();

    const res = await request.post('/api/auth/refresh').send({
      refreshToken: auth.refreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid refresh token', async () => {
    const res = await request.post('/api/auth/refresh').send({
      refreshToken: 'invalid-token-value',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing refresh token', async () => {
    const res = await request.post('/api/auth/refresh').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth API — POST /api/auth/logout', () => {
  it('should logout successfully with valid token', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/auth/logout')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out');
  });

  it('should reject logout without token', async () => {
    const res = await request.post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth API — GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .get('/api/auth/me')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(auth.email);
    expect(res.body.data.fullName).toBeDefined();
  });

  it('should reject request without token', async () => {
    const res = await request.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject request with invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-jwt-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
