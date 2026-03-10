import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// ─── GET /stats — dashboard statistics ──────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    // Total students (non-admin users)
    const totalStudents = await prisma.user.count({
      where: { role: 'USER' },
    });

    // New this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = await prisma.user.count({
      where: {
        role: 'USER',
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Documents submitted
    const documentsSubmitted = await prisma.userDocument.count();

    // Accepted applications
    const accepted = await prisma.application.count({
      where: { status: 'ACCEPTED' },
    });

    // Average XP
    const avgResult = await prisma.playerProfile.aggregate({
      _avg: { xp: true },
    });
    const averageXp = Math.round(avgResult._avg.xp || 0);

    // Top students by XP
    const topStudentProfiles = await prisma.playerProfile.findMany({
      take: 5,
      orderBy: { xp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const topStudentIds = topStudentProfiles.map((p) => p.userId);
    const studentBadgeCounts = await prisma.badge.groupBy({
      by: ['userId'],
      where: { userId: { in: topStudentIds } },
      _count: { id: true },
    });

    const studentBadgeMap = new Map<string, number>();
    studentBadgeCounts.forEach((bc) => {
      studentBadgeMap.set(bc.userId, bc._count.id);
    });

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
      data: {
        totalStudents,
        newThisWeek,
        documentsSubmitted,
        accepted,
        averageXp,
        topStudents,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get stats' });
  }
});

// ─── GET /students — paginated list of students ─────────────────
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const where: any = { role: 'USER' };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          application: {
            include: {
              faculty: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get badge counts for all students
    const studentIds = students.map((s) => s.id);
    const badgeCounts = await prisma.badge.groupBy({
      by: ['userId'],
      where: { userId: { in: studentIds } },
      _count: { id: true },
    });

    const badgeCountMap = new Map<string, number>();
    badgeCounts.forEach((bc) => {
      badgeCountMap.set(bc.userId, bc._count.id);
    });

    // Get completed quest counts
    const questCounts = await prisma.questCompletion.groupBy({
      by: ['userId'],
      where: { userId: { in: studentIds } },
      _count: { id: true },
    });

    const questCountMap = new Map<string, number>();
    questCounts.forEach((qc) => {
      questCountMap.set(qc.userId, qc._count.id);
    });

    const items = students.map((s) => ({
      id: s.id,
      email: s.email,
      fullName: s.fullName,
      phone: s.phone,
      avatarUrl: s.avatarUrl,
      language: s.language.toLowerCase(),
      createdAt: s.createdAt.toISOString(),
      xp: s.profile?.xp || 0,
      level: s.profile?.level || 'beginner',
      badgeCount: badgeCountMap.get(s.id) || 0,
      questCount: questCountMap.get(s.id) || 0,
      applicationStatus: s.application?.status?.toLowerCase() || 'new',
      chosenFaculty: s.application?.faculty
        ? {
            id: s.application.faculty.id,
            slug: s.application.faculty.slug,
            name: { ru: s.application.faculty.nameRu, tk: s.application.faculty.nameTk },
          }
        : null,
    }));

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
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
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        application: {
          include: { faculty: true },
        },
      },
    });

    if (!user || user.role === 'ADMIN') {
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
        role: 'student',
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
        chosenFaculty: user.application?.faculty
          ? {
              id: user.application.faculty.id,
              slug: user.application.faculty.slug,
              name: {
                ru: user.application.faculty.nameRu,
                tk: user.application.faculty.nameTk,
              },
              description: {
                ru: user.application.faculty.descriptionRu,
                tk: user.application.faculty.descriptionTk,
              },
              tuitionPerYear: user.application.faculty.tuitionPerYear,
              durationYears: user.application.faculty.durationYears,
              imageUrl: user.application.faculty.imageUrl,
            }
          : null,
        applicationStatus: user.application?.status?.toLowerCase() || 'new',
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

// ─── PUT /students/:id/status — update application status ───────
const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'DOCUMENTS_REVIEW', 'ACCEPTED', 'REJECTED']),
});

router.put('/students/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { status } = parsed.data;

    // Verify the user exists and is a student
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!user || user.role === 'ADMIN') {
      res.status(404).json({ success: false, data: null, message: 'Student not found' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { userId: id },
    });

    if (!application) {
      res.status(404).json({ success: false, data: null, message: 'Application not found' });
      return;
    }

    const updated = await prisma.application.update({
      where: { userId: id },
      data: { status: status as any },
    });

    res.json({
      success: true,
      data: {
        userId: id,
        applicationId: updated.id,
        status: updated.status.toLowerCase(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update application status',
    });
  }
});

export default router;
