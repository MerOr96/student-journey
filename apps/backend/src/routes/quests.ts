import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QUESTS, getLevelForXp, canStartQuest, completeQuest } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ─── Helper: build shared PlayerProfile from DB ─────────────────
async function buildSharedProfile(userId: string): Promise<SharedProfile> {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId },
  });

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

// ─── GET / — list all quests with completion status ─────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const sharedProfile = await buildSharedProfile(req.userId!);

    const questsWithStatus = QUESTS.map((quest) => ({
      ...quest,
      completed: sharedProfile.completedQuests.includes(quest.slug),
      canStart: canStartQuest(sharedProfile, quest.slug),
    }));

    res.json({
      success: true,
      data: questsWithStatus,
    });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get quests' });
  }
});

// ─── POST /:slug/complete — complete a quest ────────────────────
router.post('/:slug/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.userId!;

    // Build shared profile
    const sharedProfile = await buildSharedProfile(userId);

    // Check if quest can be started
    if (!canStartQuest(sharedProfile, slug as any)) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Quest cannot be completed: either already completed or level requirement not met',
      });
      return;
    }

    // Process completion using shared game logic
    const result = completeQuest(sharedProfile, slug as any);
    if (!result) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Quest not found or already completed',
      });
      return;
    }

    const quest = QUESTS.find((q) => q.slug === slug)!;

    // Execute all DB operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Create quest completion record
      await tx.questCompletion.create({
        data: {
          userId,
          questSlug: slug,
          xpAwarded: quest.xpReward,
        },
      });

      // Update player profile with new XP and level
      await tx.playerProfile.update({
        where: { userId },
        data: {
          xp: result.newXp,
          level: result.newLevel,
        },
      });

      // Award badge if any
      if (result.badgeEarned) {
        await tx.badge.upsert({
          where: {
            userId_badgeSlug: { userId, badgeSlug: result.badgeEarned },
          },
          update: {},
          create: {
            userId,
            badgeSlug: result.badgeEarned,
          },
        });
      }
    });

    res.json({
      success: true,
      data: {
        questSlug: slug,
        xpAwarded: quest.xpReward,
        newXp: result.newXp,
        newLevel: result.newLevel,
        badgeEarned: result.badgeEarned || null,
      },
    });
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to complete quest' });
  }
});

export default router;
