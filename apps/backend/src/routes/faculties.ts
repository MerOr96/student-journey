import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QUESTS, canStartQuest, completeQuest } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';
import { FACULTIES, ALL_SPECIALTIES } from '../data/faculties';

const router = Router();
const prisma = new PrismaClient();

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

// ─── GET / — список факультетов (локальные данные) ───────────────
router.get('/', (_req, res: Response) => {
  const data = FACULTIES.map((f) => ({
    id: f.id,
    name: f.name,
    specialtyCount: f.specialties.length,
  }));
  res.json({ success: true, data });
});

// ─── GET /specialties — направления подготовки ───────────────────
router.get('/specialties', (req, res: Response) => {
  const facultyId = req.query.faculty ? Number(req.query.faculty) : null;
  const specialties = facultyId
    ? ALL_SPECIALTIES.filter((s) => s.facultyId === facultyId)
    : ALL_SPECIALTIES;
  res.json({ success: true, data: specialties });
});

// ─── GET /chosen — текущий выбор факультета пользователя ────────
router.get('/chosen', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { chosenFacultyId: true, chosenSpecialtyId: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: 'Failed to get chosen faculty' });
  }
});

// ─── POST /choose — сохранить выбор факультета + выполнить квест ─
router.post('/choose', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, facultyName, specialtyId, specialtyName } = req.body as {
      facultyId?: number;
      facultyName?: string;
      specialtyId?: number;
      specialtyName?: string;
    };
    if (!facultyId) {
      res.status(400).json({ success: false, data: null, message: 'facultyId is required' });
      return;
    }

    // Сохраняем выбор в БД
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        chosenFacultyId: facultyId,
        chosenFacultyName: facultyName ?? null,
        chosenSpecialtyId: specialtyId ?? null,
        chosenSpecialtyName: specialtyName ?? null,
      },
    });

    // Пробуем выполнить квест choose_faculty
    let questResult = null;
    const sharedProfile = await buildSharedProfile(req.userId!);
    if (canStartQuest(sharedProfile, 'choose_faculty')) {
      const result = completeQuest(sharedProfile, 'choose_faculty');
      if (result) {
        const quest = QUESTS.find((q) => q.slug === 'choose_faculty')!;
        await prisma.$transaction(async (tx) => {
          await tx.questCompletion.create({
            data: { userId: req.userId!, questSlug: 'choose_faculty', xpAwarded: quest.xpReward },
          });
          await tx.playerProfile.update({
            where: { userId: req.userId },
            data: { xp: result.newXp, level: result.newLevel },
          });
          if (result.badgeEarned) {
            await tx.badge.upsert({
              where: { userId_badgeSlug: { userId: req.userId!, badgeSlug: result.badgeEarned } },
              update: {},
              create: { userId: req.userId!, badgeSlug: result.badgeEarned },
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

    res.json({ success: true, data: { facultyId, facultyName: facultyName ?? null, specialtyId: specialtyId ?? null, specialtyName: specialtyName ?? null, questCompleted: questResult } });
  } catch (error) {
    console.error('Choose faculty error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to choose faculty' });
  }
});

export default router;
