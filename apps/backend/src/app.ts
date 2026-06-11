import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import questsRouter from './routes/quests';
import documentsRouter from './routes/documents';
import facultiesRouter from './routes/faculties';

import chatRouter from './routes/chat';
import leaderboardRouter from './routes/leaderboard';
import adminRouter from './routes/admin';
import crmRouter from './routes/crm';
import liveChatRouter from './routes/live-chat';
import certificatesRouter from './routes/certificates';
import webhooksRouter from './routes/webhooks';
import examsRouter from './routes/exams';
import notificationsRouter from './routes/notifications';

const startedAt = Date.now();

export function createApp() {
  const app = express();
  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/quests', questsRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/faculties', facultiesRouter);

  app.use('/api/chat/live', liveChatRouter); // ← ВАЖНО: до /api/chat
  app.use('/api/chat', chatRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/crm', crmRouter);
  app.use('/api/certificates', certificatesRouter);
  app.use('/api/webhooks', webhooksRouter);
  app.use('/api/exams', examsRouter);
  app.use('/api/notifications', notificationsRouter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        data: null,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      });
    }
  );

  return app;
}

