import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getOverallProgress, getXpProgressPercent } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All profile routes require authentication
router.use(authenticate);

// ─── GET / ──────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: req.userId },
      include: { user: { select: { updatedAt: true } } },
    });

    if (!profile) {
      res.status(404).json({ success: false, data: null, message: 'Profile not found' });
      return;
    }

    const completedQuests = await prisma.questCompletion.findMany({
      where: { userId: req.userId },
      select: { questSlug: true },
    });

    const badges = await prisma.badge.findMany({
      where: { userId: req.userId },
      select: { badgeSlug: true },
    });

    const completedSlugs = completedQuests.map((q) => q.questSlug);
    const badgeSlugs = badges.map((b) => b.badgeSlug);

    const sharedProfile: SharedProfile = {
      userId: profile.userId,
      xp: profile.xp,
      level: profile.level as SharedProfile['level'],
      completedQuests: completedSlugs,
      badges: badgeSlugs,
    };

    res.json({
      success: true,
      data: {
        ...sharedProfile,
        overallProgress: getOverallProgress(sharedProfile),
        xpProgress: getXpProgressPercent(profile.xp),
        updatedAt: profile.user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get profile' });
  }
});

// ─── PUT / ──────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  language: z.enum(['RU', 'TK', 'ru', 'tk']).transform(v => v.toUpperCase() as 'RU' | 'TK').optional(),
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { fullName, phone, language } = parsed.data;

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role === 'ADMIN' ? 'admin' : 'student',
        language: user.language.toLowerCase(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to update profile' });
  }
});

export default router;
