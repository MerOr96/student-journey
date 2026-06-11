import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendPush } from '../services/push';
import type { LiveMessage } from '@student-journey/shared';

const router = Router();
const prisma = new PrismaClient();

// ─── GET / — история сообщений текущего пользователя ────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.liveMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Отмечаем входящие сообщения куратора как прочитанные
    await prisma.liveMessage.updateMany({
      where: { userId: req.userId, fromUser: false, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to load messages' });
  }
});

// ─── POST / — студент отправляет сообщение куратору ─────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ success: false, data: null, message: 'content is required' });
      return;
    }

    const message = await prisma.liveMessage.create({
      data: {
        userId: req.userId!,
        fromUser: true,
        content: content.trim(),
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to send message' });
  }
});

// ─── GET /admin/users — список пользователей с непрочитанными ───
// (только для куратора/админа)
router.get('/admin/users', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    // Берём всех пользователей у кого есть live сообщения
    const usersWithMessages = await prisma.user.findMany({
      where: { liveMessages: { some: {} } },
      select: {
        id: true,
        fullName: true,
        email: true,
        appRole: true,
        liveMessages: {
          where: { fromUser: true, isRead: false },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = usersWithMessages.map((u) => ({
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      appRole: u.appRole,
      unreadCount: u.liveMessages.length,
    }));

    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to load users' });
  }
});

// ─── GET /admin/users/:userId — история чата конкретного студента ─
router.get('/admin/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.liveMessage.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Отмечаем сообщения студента как прочитанные куратором
    await prisma.liveMessage.updateMany({
      where: { userId: req.params.userId, fromUser: true, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to load messages' });
  }
});

// ─── POST /admin/users/:userId — куратор отвечает студенту ───────
router.post('/admin/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ success: false, data: null, message: 'content is required' });
      return;
    }

    // Проверяем что такой пользователь существует
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!targetUser) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const message = await prisma.liveMessage.create({
      data: {
        userId: req.params.userId,
        fromUser: false, // ← это куратор пишет
        content: content.trim(),
      },
    });

    // Push-уведомление студенту
    if (targetUser.pushToken) {
      void sendPush(targetUser.pushToken, {
        title: 'Сообщение от куратора',
        body: content.trim().slice(0, 100),
        screen: 'chat',
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to send message' });
  }
});

export default router;
