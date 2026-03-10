import { describe, it, expect } from 'vitest';
import { request, getAuthHeader } from './helpers';

describe('Chat API — GET /api/chat', () => {
  it('should return empty chat history for new user', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .get('/api/chat')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    // New: pagination metadata
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.page).toBe(1);
  });

  it('should support pagination parameters', async () => {
    const auth = await getAuthHeader();

    // Send 3 messages
    for (let i = 0; i < 3; i++) {
      await request
        .post('/api/chat')
        .set('Authorization', auth.authorization)
        .send({ content: `Сообщение ${i + 1}` });
    }

    // Fetch page 1 with pageSize=2 (3 messages → 6 total: 3 user + 3 assistant)
    const res = await request
      .get('/api/chat?page=1&pageSize=2')
      .set('Authorization', auth.authorization);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(6);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it('should reject request without authentication', async () => {
    const res = await request.get('/api/chat');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Chat API — POST /api/chat', () => {
  it('should send a message and receive assistant response', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/chat')
      .set('Authorization', auth.authorization)
      .send({ content: 'Привет!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userMessage).toBeDefined();
    expect(res.body.data.userMessage.role).toBe('user');
    expect(res.body.data.userMessage.content).toBe('Привет!');
    expect(res.body.data.assistantMessage).toBeDefined();
    expect(res.body.data.assistantMessage.role).toBe('assistant');
    expect(res.body.data.assistantMessage.content.length).toBeGreaterThan(0);
  });

  it('should reject empty message', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/chat')
      .set('Authorization', auth.authorization)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject whitespace-only message', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/chat')
      .set('Authorization', auth.authorization)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should respond about documents when asked', async () => {
    const auth = await getAuthHeader();

    const res = await request
      .post('/api/chat')
      .set('Authorization', auth.authorization)
      .send({ content: 'Какие документы нужны для поступления?' });

    expect(res.status).toBe(200);
    expect(res.body.data.assistantMessage.content).toContain('документ');
  });

  // ─── BUG TEST: should reject message longer than 1000 chars ───
  it('should reject message longer than 1000 characters', async () => {
    const auth = await getAuthHeader();
    const longMessage = 'А'.repeat(1001);

    const res = await request
      .post('/api/chat')
      .set('Authorization', auth.authorization)
      .send({ content: longMessage });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('too long');
  });
});
