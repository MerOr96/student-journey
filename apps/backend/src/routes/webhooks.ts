/**
 * Webhook endpoint — принимает события от Django CRM.
 * Django → POST /api/webhooks/django → Node.js отправляет push студенту.
 */
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPush, sendPushBatch } from '../services/push';

const router = Router();
const prisma = new PrismaClient();

const WEBHOOK_SECRET = process.env.NODE_WEBHOOK_SECRET || '';

function verifySecret(req: Request, res: Response): boolean {
  if (!WEBHOOK_SECRET) return true; // В dev режиме без проверки
  const secret = req.headers['x-webhook-secret'];
  if (secret !== WEBHOOK_SECRET) {
    res.status(403).json({ ok: false, error: 'Invalid webhook secret' });
    return false;
  }
  return true;
}

// ─── POST /django — события от Django CRM ────────────────────────
router.post('/django', async (req: Request, res: Response) => {
  if (!verifySecret(req, res)) return;

  try {
    const {
      event,
      studentEmail,
      studentId,
      applicantId,
      emails,
      studentIds,
      applicantIds,
      pushTitle,
      pushBody,
      screen,
      certificateId,
    } = req.body as {
      event?: string;
      studentEmail?: string;
      studentId?: number;
      applicantId?: number;
      emails?: string[];
      studentIds?: number[];
      applicantIds?: number[];
      pushTitle?: string;
      pushBody?: string;
      screen?: string;
      certificateId?: string;
    };

    if (!event) {
      res.status(400).json({ ok: false, error: 'event required' });
      return;
    }

    switch (event) {
      // 1. Уведомление одному студенту (смена статуса справки, создание заявки)
      case 'push_notification':
      case 'certificate_created':
      case 'certificate_status_changed': {
        if (!studentEmail && !studentId && !applicantId) {
          res.status(400).json({ ok: false, error: 'Target identifier required for this event' });
          return;
        }

        const whereClause: any = [];
        if (studentId) whereClause.push({ crmStudentId: studentId });
        if (applicantId) whereClause.push({ crmApplicantId: applicantId });
        if (studentEmail) whereClause.push({ email: studentEmail.toLowerCase() });

        const user = await prisma.user.findFirst({
          where: { OR: whereClause },
          select: { pushToken: true },
        });

        if (user?.pushToken) {
          const payloadData: Record<string, string> = {};
          if (certificateId) payloadData.certificateId = String(certificateId);

          await sendPush(user.pushToken, {
            title: pushTitle || 'Обновление',
            body: pushBody || '',
            screen: screen || '',
            data: payloadData,
          });
          res.json({ ok: true, pushed: true });
        } else {
          res.json({ ok: true, pushed: false, reason: 'no push token' });
        }
        break;
      }

      // 2. Массовая рассылка (broadcast из CRM или document expiry reminders)
      case 'broadcast': {
        if (!emails?.length && !studentIds?.length && !applicantIds?.length) {
          res.status(400).json({ ok: false, error: 'Targets required for broadcast' });
          return;
        }

        const whereClause: any = [];
        if (studentIds?.length) whereClause.push({ crmStudentId: { in: studentIds } });
        if (applicantIds?.length) whereClause.push({ crmApplicantId: { in: applicantIds } });
        if (emails?.length) whereClause.push({ email: { in: emails.map((e) => e.toLowerCase()) } });

        const users = await prisma.user.findMany({
          where: {
            OR: whereClause,
            pushToken: { not: null },
          },
          select: { pushToken: true },
        });

        const tokens = users.map((u) => u.pushToken).filter(Boolean) as string[];

        if (tokens.length > 0) {
          await sendPushBatch(tokens, {
            title: pushTitle || 'Уведомление',
            body: pushBody || '',
            screen: screen || '',
          });
          res.json({ ok: true, pushed: true, count: tokens.length });
        } else {
          res.json({ ok: true, pushed: false, reason: 'no push tokens found' });
        }
        break;
      }

      default:
        res.status(400).json({ ok: false, error: 'unknown event type' });
        break;
    }
  } catch (err) {
    console.error('[webhooks] /django error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

export default router;
