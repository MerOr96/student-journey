import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

// GET /api/notifications - получить список сообщений (входящие)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crmApplicantId: true, email: true }
    });

    if (!user || !user.crmApplicantId) {
      res.json({ success: true, data: [] });
      return;
    }

    const djangoRes = await fetch(`${DJANGO_CRM_URL}/api/student-notifications/?email=${encodeURIComponent(user.email || '')}&applicant_id=${user.crmApplicantId}`);
    if (!djangoRes.ok) throw new Error(`Django API error: ${djangoRes.status}`);
    const djangoData = await djangoRes.json();

    // Получаем список прочитанных уведомлений для этого пользователя
    const readRecords = await prisma.notificationRead.findMany({
      where: { userId },
      select: { djangoNotifId: true }
    });
    const readSet = new Set(readRecords.map(r => r.djangoNotifId));

    const notifications = (djangoData as any[]).map((notif: any) => ({
      id: String(notif.id),
      userId: userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      isRead: readSet.has(notif.id),
      createdAt: notif.created_at
    }));

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('[notifications] proxy error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crmApplicantId: true, email: true }
    });

    if (!user || !user.crmApplicantId) {
      res.json({ success: true, data: { count: 0 } });
      return;
    }

    const djangoRes = await fetch(`${DJANGO_CRM_URL}/api/student-notifications/?email=${encodeURIComponent(user.email || '')}&applicant_id=${user.crmApplicantId}`);
    if (!djangoRes.ok) throw new Error(`Django API error: ${djangoRes.status}`);
    const djangoData = await djangoRes.json();

    const readRecords = await prisma.notificationRead.findMany({
      where: { userId },
      select: { djangoNotifId: true }
    });
    const readSet = new Set(readRecords.map(r => r.djangoNotifId));

    let unreadCount = 0;
    for (const notif of (djangoData as any[])) {
      if (!readSet.has(notif.id)) unreadCount++;
    }

    res.json({ success: true, data: { count: unreadCount } });
  } catch (err) {
    console.error('[notifications] /unread-count proxy error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT /api/notifications/:id/read - пометить как прочитанное
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const djangoNotifId = parseInt(req.params.id, 10);
    const userId = req.userId!;

    if (!isNaN(djangoNotifId)) {
      await prisma.notificationRead.upsert({
        where: {
          userId_djangoNotifId: { userId, djangoNotifId }
        },
        update: {},
        create: {
          userId,
          djangoNotifId
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[notifications] /read error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
