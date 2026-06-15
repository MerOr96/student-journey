import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

function fetchCRM(url: string, options?: RequestInit): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

// ─── GET / — список заявок текущего пользователя (Прокси из Django) ─────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const crmRes = await fetchCRM(`${DJANGO_CRM_URL}/api/certificates/?email=${encodeURIComponent(user.email)}`, {
      headers: {
        'X-App-User-Email': user.email,
        ...(user.crmStudentId ? { 'X-App-Crm-Student-Id': String(user.crmStudentId) } : {})
      }
    });
    
    if (crmRes.status === 404) {
      // Студент еще не передан в CRM, значит заявок быть не может
      res.json({ success: true, data: [] });
      return;
    }
    
    if (!crmRes.ok) {
      res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
      return;
    }

    const data = await crmRes.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[certificates] Proxy GET error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

// ─── POST / — создать заявку (Прокси в Django) ──────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const { request_type, description } = req.body as {
      request_type?: string;
      description?: string;
    };

    if (!description?.trim()) {
      res.status(400).json({ success: false, data: null, message: 'description обязателен' });
      return;
    }

    const validTypes = ['certificate', 'petition', 'other'];
    const type = validTypes.includes(request_type ?? '') ? request_type! : 'other';

    const crmRes = await fetchCRM(`${DJANGO_CRM_URL}/api/certificates/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-User-Email': user.email,
        ...(user.crmStudentId ? { 'X-App-Crm-Student-Id': String(user.crmStudentId) } : {})
      },
      body: JSON.stringify({ email: user.email, request_type: type, description: description.trim() }),
    });

    if (!crmRes.ok) {
      let djangoError = '';
      try { djangoError = await crmRes.text(); } catch { /* ignore */ }
      console.error(`[CRM POST /certificates] Django вернул ${crmRes.status}: ${djangoError}`);

      if (crmRes.status === 404) {
        res.status(404).json({ success: false, data: null, message: 'Студент не найден в CRM' });
      } else if (crmRes.status === 400) {
        res.status(400).json({ success: false, data: null, message: djangoError });
      } else {
        res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
      }
      return;
    }

    const data = await crmRes.json();
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[certificates] Proxy POST error:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

export default router;
