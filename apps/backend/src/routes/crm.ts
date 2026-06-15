import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const prisma = new PrismaClient();

router.use((req, _res, next) => {
  console.log(`[CRM] ${req.method} ${req.path}`, req.body);
  next();
});

const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';


// Обёртка с таймаутом — если Django недоступен не висим бесконечно
function fetchCRM(url: string, options?: RequestInit): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 сек
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

// ─── GET /status — статус заявки абитуриента из Django ──────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const crmResponse = await fetchCRM(
      `${DJANGO_CRM_URL}/api/status/?email=${encodeURIComponent(user.email)}`,
    );

    if (crmResponse.status === 404) {
      res.json({ success: true, data: null });
      return;
    }

    if (!crmResponse.ok) {
      res.json({ success: true, data: null }); // Django недоступен — возвращаем null без ошибки
      return;
    }

    const crmData = await crmResponse.json();
    res.json({ success: true, data: crmData });
  } catch {
    res.json({ success: true, data: null }); // Таймаут или ошибка — не падаем
  }
});

// ─── GET /student — данные студента из Django (только для STUDENT) ──
router.get('/student', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    if (user.appRole !== 'STUDENT') {
      res.status(403).json({ success: false, data: null, message: 'Not a student yet' });
      return;
    }

    const crmResponse = await fetchCRM(
      `${DJANGO_CRM_URL}/api/me/`,
      {
        headers: {
          'X-App-User-Email': user.email,
          'X-App-User-Id': user.id,
          ...(user.crmStudentId ? { 'X-App-Crm-Student-Id': String(user.crmStudentId) } : {})
        },
      }
    );

    if (!crmResponse.ok) {
      res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
      return;
    }

    const crmData = await crmResponse.json();
    res.json({ success: true, data: crmData });
  } catch {
    res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
  }
});

// ─── POST /student/upload — загрузка скана документа во временную базу CRM
router.post('/student/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.appRole !== 'STUDENT') {
      res.status(403).json({ success: false, data: null, message: 'Not a student' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, data: null, message: 'File is required' });
      return;
    }
    
    const docType = req.body.doc_type;
    if (!docType) {
      res.status(400).json({ success: false, data: null, message: 'doc_type is required' });
      return;
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);
    formData.append('doc_type', docType);

    const crmResponse = await fetchCRM(
      `${DJANGO_CRM_URL}/api/me/upload-document/`,
      {
        method: 'POST',
        headers: {
          'X-App-User-Email': user.email,
          'X-App-User-Id': user.id,
          ...(user.crmStudentId ? { 'X-App-Crm-Student-Id': String(user.crmStudentId) } : {})
        },
        body: formData,
      }
    );

    if (!crmResponse.ok) {
      res.status(502).json({ success: false, data: null, message: 'CRM upload failed' });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('Upload error', err);
    res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
  }
});

// ─── POST /link — привязать внешнего абитуриента к аккаунту ─────
// Когда абитуриент уже создан в Django и ему дали логин/пароль вручную
// После логина — вызывается этот эндпоинт чтобы найти его запись в CRM
router.post('/link', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    if (user.crmApplicantId) {
      res.json({ success: true, data: { crmApplicantId: user.crmApplicantId } });
      return;
    }

    // Ищем по email в Django
    const crmResponse = await fetchCRM(
      `${DJANGO_CRM_URL}/api/status/?email=${encodeURIComponent(user.email)}`,
    );

    if (crmResponse.status === 404) {
      res.status(404).json({ success: false, data: null, message: 'No CRM record found for this email' });
      return;
    }

    if (!crmResponse.ok) {
      res.status(502).json({ success: false, data: null, message: 'CRM unavailable' });
      return;
    }

    const crmData = (await crmResponse.json()) as { id: number; is_converted?: boolean };

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        crmApplicantId: crmData.id,
        appRole: crmData.is_converted ? 'STUDENT' : 'APPLICANT',
      },
    });

    res.json({ success: true, data: { crmApplicantId: crmData.id } });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Link failed' });
  }
});


// ─── POST /push-token — сохранить FCM токен для пушей ────────────
router.post('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body as { token?: string };
    require('fs').appendFileSync('push_token_debug.log', `[${new Date().toISOString()}] User: ${req.userId}, Token: ${token}\n`);
    
    if (!token) {
      res.status(400).json({ success: false, data: null, message: 'token is required' });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { pushToken: token },
    });

    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to save push token' });
  }
});



export default router;
