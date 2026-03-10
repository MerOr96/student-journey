import supertest from 'supertest';
import { createApp } from '../app';

export const app = createApp();
export const request = supertest(app);

/**
 * Register a fresh test user and return tokens + user data.
 */
export async function registerUser(overrides: Record<string, any> = {}) {
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const payload = {
    email,
    password: 'TestPass123',
    fullName: 'Test User',
    language: 'RU',
    ...overrides,
  };

  const res = await request.post('/api/auth/register').send(payload);
  return {
    ...res.body.data,
    email: payload.email,
    password: payload.password,
  };
}

/**
 * Register a user and return an Authorization header value.
 */
export async function getAuthHeader(overrides: Record<string, any> = {}) {
  const data = await registerUser(overrides);
  return {
    authorization: `Bearer ${data.accessToken}`,
    refreshToken: data.refreshToken,
    user: data.user,
    email: data.email,
    password: data.password,
  };
}
