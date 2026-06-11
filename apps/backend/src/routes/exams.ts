import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

// GET /api/exams - получить список экзаменов пользователя (Прокси из Django)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crmApplicantId: true }
    });

    if (!user || !user.crmApplicantId) {
      // Если абитуриент еще не передан в CRM, экзаменов быть не может
      res.json({ success: true, data: [] });
      return;
    }

    const djangoRes = await fetch(`${DJANGO_CRM_URL}/api/student-exams/?applicant_id=${user.crmApplicantId}`);
    if (!djangoRes.ok) {
      throw new Error(`Django API error: ${djangoRes.status}`);
    }

    const data = await djangoRes.json();
    
    // Преобразуем данные из Django в формат, который ждет мобилка
    // Мобилка ждет: id, subject, examDate, meetingLink, score, status, materials
    const formattedData = (data as any[]).map((exam: any) => ({
      id: String(exam.id),
      userId: userId,
      subject: exam.subject,
      examDate: exam.exam_date,
      meetingLink: exam.meeting_link,
      score: exam.score,
      status: exam.status,
      materials: exam.materials || []
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    console.error('[exams] proxy error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
