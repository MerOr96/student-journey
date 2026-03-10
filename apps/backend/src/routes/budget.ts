import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  calculateBudget,
  QUESTS,
  canStartQuest,
  completeQuest,
} from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── Validation ─────────────────────────────────────────────────
const budgetInputSchema = z.object({
  facultySlug: z.string().min(1, 'facultySlug is required'),
  dormitory: z.boolean(),
  mealPlan: z.enum(['basic', 'standard', 'premium']),
  insuranceIncluded: z.boolean(),
});

// ─── Helper: build shared profile ───────────────────────────────
async function buildSharedProfile(userId: string): Promise<SharedProfile> {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } });
  const completedQuests = await prisma.questCompletion.findMany({
    where: { userId },
    select: { questSlug: true },
  });
  const badges = await prisma.badge.findMany({
    where: { userId },
    select: { badgeSlug: true },
  });

  return {
    userId,
    xp: profile?.xp ?? 0,
    level: (profile?.level as SharedProfile['level']) ?? 'beginner',
    completedQuests: completedQuests.map((q) => q.questSlug),
    badges: badges.map((b) => b.badgeSlug),
  };
}

// ─── POST /calculate ────────────────────────────────────────────
router.post('/calculate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = budgetInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { facultySlug, dormitory, mealPlan, insuranceIncluded } = parsed.data;

    // Look up faculty tuition
    const faculty = await prisma.faculty.findUnique({
      where: { slug: facultySlug },
    });

    if (!faculty) {
      res.status(404).json({ success: false, data: null, message: 'Faculty not found' });
      return;
    }

    // Calculate budget using shared game logic
    const breakdown = calculateBudget(
      { facultySlug, dormitory, mealPlan, insuranceIncluded },
      faculty.tuitionPerYear
    );

    // Try to complete the calculate_budget quest
    let questResult = null;
    const sharedProfile = await buildSharedProfile(req.userId!);
    if (canStartQuest(sharedProfile, 'calculate_budget')) {
      const result = completeQuest(sharedProfile, 'calculate_budget');
      if (result) {
        const quest = QUESTS.find((q) => q.slug === 'calculate_budget')!;
        await prisma.$transaction(async (tx) => {
          await tx.questCompletion.create({
            data: {
              userId: req.userId!,
              questSlug: 'calculate_budget',
              xpAwarded: quest.xpReward,
            },
          });

          await tx.playerProfile.update({
            where: { userId: req.userId },
            data: { xp: result.newXp, level: result.newLevel },
          });

          if (result.badgeEarned) {
            await tx.badge.upsert({
              where: {
                userId_badgeSlug: {
                  userId: req.userId!,
                  badgeSlug: result.badgeEarned,
                },
              },
              update: {},
              create: {
                userId: req.userId!,
                badgeSlug: result.badgeEarned,
              },
            });
          }
        });

        questResult = {
          questSlug: 'calculate_budget',
          xpAwarded: quest.xpReward,
          newXp: result.newXp,
          newLevel: result.newLevel,
          badgeEarned: result.badgeEarned || null,
        };
      }
    }

    res.json({
      success: true,
      data: {
        breakdown,
        questCompleted: questResult,
      },
    });
  } catch (error) {
    console.error('Calculate budget error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to calculate budget' });
  }
});

export default router;
