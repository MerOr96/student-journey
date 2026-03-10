import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QUESTS, getLevelForXp, canStartQuest, completeQuest } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── Helper: format faculty for API response ────────────────────
function formatFaculty(f: any) {
  return {
    id: f.id,
    slug: f.slug,
    name: { ru: f.nameRu, tk: f.nameTk },
    description: { ru: f.descriptionRu, tk: f.descriptionTk },
    tuitionPerYear: f.tuitionPerYear,
    durationYears: f.durationYears,
    imageUrl: f.imageUrl,
  };
}

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

// ─── GET / — list all faculties ─────────────────────────────────
router.get('/', async (_req, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: { nameRu: 'asc' },
    });

    res.json({
      success: true,
      data: faculties.map(formatFaculty),
    });
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get faculties' });
  }
});

// ─── GET /:slug — get faculty detail ────────────────────────────
router.get('/:slug', async (req, res: Response) => {
  try {
    const faculty = await prisma.faculty.findUnique({
      where: { slug: req.params.slug },
    });

    if (!faculty) {
      res.status(404).json({ success: false, data: null, message: 'Faculty not found' });
      return;
    }

    res.json({
      success: true,
      data: formatFaculty(faculty),
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get faculty' });
  }
});

// ─── POST /choose — choose a faculty (protected) ────────────────
router.post('/choose', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { facultySlug } = req.body;
    if (!facultySlug) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'facultySlug is required',
      });
      return;
    }

    const faculty = await prisma.faculty.findUnique({
      where: { slug: facultySlug },
    });

    if (!faculty) {
      res.status(404).json({ success: false, data: null, message: 'Faculty not found' });
      return;
    }

    // Update application with chosen faculty
    const application = await prisma.application.findUnique({
      where: { userId: req.userId },
    });

    if (!application) {
      res.status(404).json({ success: false, data: null, message: 'Application not found' });
      return;
    }

    await prisma.application.update({
      where: { userId: req.userId },
      data: {
        facultyId: faculty.id,
        status: application.status === 'NEW' ? 'IN_PROGRESS' : application.status,
      },
    });

    // Try to complete the choose_faculty quest
    let questResult = null;
    const sharedProfile = await buildSharedProfile(req.userId!);
    if (canStartQuest(sharedProfile, 'choose_faculty')) {
      const result = completeQuest(sharedProfile, 'choose_faculty');
      if (result) {
        const quest = QUESTS.find((q) => q.slug === 'choose_faculty')!;
        await prisma.$transaction(async (tx) => {
          await tx.questCompletion.create({
            data: {
              userId: req.userId!,
              questSlug: 'choose_faculty',
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
          questSlug: 'choose_faculty',
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
        faculty: formatFaculty(faculty),
        questCompleted: questResult,
      },
    });
  } catch (error) {
    console.error('Choose faculty error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to choose faculty' });
  }
});

export default router;
