import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireAdmin);

// ─── GET /stats ──────────────────────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER', deletedAt: null } });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = await prisma.user.count({
      where: { role: 'USER', deletedAt: null, createdAt: { gte: oneWeekAgo } },
    });

    const documentsSubmitted = await prisma.userDocument.count();

    const totalStudents = await prisma.user.count({
      where: { role: 'USER', appRole: 'STUDENT', deletedAt: null },
    });

    const avgResult = await prisma.playerProfile.aggregate({ _avg: { xp: true } });
    const averageXp = Math.round(avgResult._avg.xp || 0);

    const topStudentProfiles = await prisma.playerProfile.findMany({
      take: 5,
      orderBy: { xp: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
    });

    const topStudentIds = topStudentProfiles.map((p) => p.userId);
    const studentBadgeCounts = await prisma.badge.groupBy({
      by: ['userId'],
      where: { userId: { in: topStudentIds } },
      _count: { id: true },
    });

    const studentBadgeMap = new Map<string, number>();
    studentBadgeCounts.forEach((bc) => studentBadgeMap.set(bc.userId, bc._count.id));

    const topStudents = topStudentProfiles
      .filter((p) => p.user.role !== 'ADMIN')
      .map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        xp: p.xp,
        level: p.level,
        badgeCount: studentBadgeMap.get(p.userId) || 0,
      }));

    res.json({
      success: true,
      data: { totalUsers, newThisWeek, documentsSubmitted, totalStudents, averageXp, topStudents },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get stats' });
  }
});

// ─── GET /students — paginated list ─────────────────────────────
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const where: any = { role: 'USER', deletedAt: null };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const badgeCounts = await prisma.badge.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });
    const badgeCountMap = new Map<string, number>();
    badgeCounts.forEach((bc) => badgeCountMap.set(bc.userId, bc._count.id));

    const questCounts = await prisma.questCompletion.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });
    const questCountMap = new Map<string, number>();
    questCounts.forEach((qc) => questCountMap.set(qc.userId, qc._count.id));

    const items = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      language: u.language.toLowerCase(),
      appRole: u.appRole.toLowerCase(),
      crmApplicantId: u.crmApplicantId,
      crmStudentId: u.crmStudentId,
      createdAt: u.createdAt.toISOString(),
      xp: u.profile?.xp || 0,
      level: u.profile?.level || 'beginner',
      badgeCount: badgeCountMap.get(u.id) || 0,
      questCount: questCountMap.get(u.id) || 0,
      chosenFacultyName: u.chosenFacultyName ?? null,
      chosenSpecialtyName: u.chosenSpecialtyName ?? null,
    }));

    res.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get students' });
  }
});

// ─── GET /students/:id — full student detail ────────────────────
router.get('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!user || user.role === 'ADMIN' || user.deletedAt) {
      res.status(404).json({ success: false, data: null, message: 'Student not found' });
      return;
    }

    const completedQuests = await prisma.questCompletion.findMany({
      where: { userId: id },
      orderBy: { completedAt: 'desc' },
    });

    const badges = await prisma.badge.findMany({
      where: { userId: id },
      orderBy: { earnedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        appRole: user.appRole.toLowerCase(),
        applicationStatus: user.applicationStatus || 'NEW',
        crmApplicantId: user.crmApplicantId,
        crmStudentId: user.crmStudentId,
        chosenFacultyId: user.chosenFacultyId,
        chosenFacultyName: user.chosenFacultyName ?? null,
        chosenSpecialtyId: user.chosenSpecialtyId,
        chosenSpecialtyName: user.chosenSpecialtyName ?? null,
        language: user.language.toLowerCase(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        profile: user.profile
          ? {
            userId: user.profile.userId,
            xp: user.profile.xp,
            level: user.profile.level,
            completedQuests: completedQuests.map((q) => q.questSlug),
            badges: badges.map((b) => b.badgeSlug),
          }
          : null,
        documents: user.documents.map((doc) => ({
          id: doc.id,
          userId: doc.userId,
          type: doc.type.toLowerCase(),
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          status: doc.status.toLowerCase(),
          uploadedAt: doc.uploadedAt.toISOString(),
          reviewedAt: doc.reviewedAt?.toISOString() || null,
          reviewNote: doc.reviewNote,
        })),
        questCompletions: completedQuests.map((q) => ({
          id: q.id,
          questSlug: q.questSlug,
          xpAwarded: q.xpAwarded,
          completedAt: q.completedAt.toISOString(),
        })),
        earnedBadges: badges.map((b) => ({
          id: b.id,
          badgeSlug: b.badgeSlug,
          earnedAt: b.earnedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get student detail error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get student detail' });
  }
});

// ─── PUT /students/:id/status — сменить статус заявки ───────────
const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'DOCUMENTS_REVIEW', 'ACCEPTED', 'REJECTED']),
});

router.put('/students/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, message: 'Invalid status' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user || user.role === 'ADMIN') {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { applicationStatus: parsed.data.status },
    });

    if (parsed.data.status === 'ACCEPTED') {
      try {
        const { completeQuest, QUESTS } = await import('@student-journey/shared');
        const profile = await prisma.playerProfile.findUnique({ where: { userId: id } });
        const completed = await prisma.questCompletion.findMany({ where: { userId: id } });
        
        const sharedProfile = {
          userId: id,
          xp: profile?.xp ?? 0,
          level: (profile?.level as any) ?? 'beginner',
          completedQuests: completed.map((q) => q.questSlug),
          badges: [],
        };
        
        const questResult = completeQuest(sharedProfile, 'application_approved');
        if (questResult) {
          const quest = QUESTS.find((q) => q.slug === 'application_approved');
          await prisma.$transaction([
            prisma.questCompletion.create({
              data: { userId: id, questSlug: 'application_approved', xpAwarded: quest!.xpReward }
            }),
            prisma.playerProfile.update({
              where: { userId: id },
              data: { xp: questResult.newXp, level: questResult.newLevel }
            })
          ]);
        }
      } catch (err) {
        console.error('Failed to auto-complete accepted quest via admin', err);
      }
    }

    res.json({ success: true, data: { id: updated.id, applicationStatus: updated.applicationStatus } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to update status' });
  }
});

// ─── POST /students/:id/transfer — передать абитуриента в Django CRM ──
const DJANGO_CRM_URL = process.env.DJANGO_CRM_URL || 'http://localhost:8000';

router.post('/students/:id/transfer', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, fullName: true, email: true, phone: true, role: true, crmApplicantId: true,
        birthDate: true, velayat: true, chosenFacultyId: true, chosenSpecialtyId: true 
      },
    });

    if (!user || user.role === 'ADMIN') {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    if (user.crmApplicantId) {
      res.json({ success: true, data: { crmApplicantId: user.crmApplicantId, alreadyTransferred: true } });
      return;
    }

    // Подготавливаем дополнительные данные для Django CRM
    const payload: Record<string, any> = {
      full_name: user.fullName,
      email: user.email,
      phone: user.phone || '',
    };
    
    if (user.velayat) payload.region = user.velayat;
    if (user.birthDate) {
      // Форматируем дату в YYYY-MM-DD
      const date = new Date(user.birthDate);
      payload.date_of_birth = date.toISOString().split('T')[0];
    }
    if (user.chosenFacultyId) payload.faculty = user.chosenFacultyId;
    if (user.chosenSpecialtyId) payload.specialty = user.chosenSpecialtyId;

    // POST to Django CRM
    const crmRes = await fetch(`${DJANGO_CRM_URL}/api/apply/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!crmRes.ok) {
      const text = await crmRes.text().catch(() => '');
      res.status(502).json({ success: false, data: null, message: `CRM error: ${crmRes.status} ${text}` });
      return;
    }

    const crmData = (await crmRes.json()) as { id?: number };
    const crmApplicantId = crmData.id ?? null;

    await prisma.user.update({
      where: { id },
      data: { crmApplicantId, applicationStatus: 'ACCEPTED' },
    });

    res.json({ success: true, data: { crmApplicantId } });
  } catch (error) {
    console.error('Transfer to CRM error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to transfer to CRM' });
  }
});

// ─── PUT /students/:id/role — перевести в студенты ───────────────
const updateRoleSchema = z.object({
  appRole: z.enum(['APPLICANT', 'STUDENT']),
  crmStudentId: z.number().int().positive().optional(),
});

router.put('/students/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user || user.role === 'ADMIN') {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        appRole: parsed.data.appRole,
        crmStudentId: parsed.data.crmStudentId,
      },
    });

    res.json({
      success: true,
      data: { id: updated.id, appRole: updated.appRole.toLowerCase() },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to update role' });
  }
});

// ─── DELETE /students/:id/progress — сброс игрового прогресса ───
router.delete('/students/:id/progress', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, deletedAt: true },
    });

    if (!user || user.role === 'ADMIN' || user.deletedAt) {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    await prisma.$transaction([
      prisma.questCompletion.deleteMany({ where: { userId: id } }),
      prisma.badge.deleteMany({ where: { userId: id } }),
      prisma.playerProfile.updateMany({
        where: { userId: id },
        data: { xp: 0, level: 'beginner' },
      }),
    ]);

    res.json({ success: true, data: { id }, message: 'Progress reset' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to reset progress' });
  }
});

// ─── DELETE /students/:id — мягкое удаление абитуриента ─────────
router.delete('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, deletedAt: true },
    });

    if (!user || user.role === 'ADMIN') {
      res.status(404).json({ success: false, data: null, message: 'User not found' });
      return;
    }

    if (user.deletedAt) {
      res.status(409).json({ success: false, data: null, message: 'User already deleted' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, data: { id }, message: 'User soft-deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to delete student' });
  }
});

export default router;
