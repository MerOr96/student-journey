import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { QUESTS, getLevelForXp, canStartQuest, completeQuest } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// ─── Multer Configuration ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, PDF'));
    }
  },
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

// ─── Helper: auto-complete quest ────────────────────────────────
async function tryAutoCompleteQuest(userId: string, questSlug: string) {
  const sharedProfile = await buildSharedProfile(userId);
  if (!canStartQuest(sharedProfile, questSlug as any)) return null;

  const result = completeQuest(sharedProfile, questSlug as any);
  if (!result) return null;

  const quest = QUESTS.find((q) => q.slug === questSlug)!;

  await prisma.$transaction(async (tx) => {
    await tx.questCompletion.create({
      data: { userId, questSlug, xpAwarded: quest.xpReward },
    });

    await tx.playerProfile.update({
      where: { userId },
      data: { xp: result.newXp, level: result.newLevel },
    });

    if (result.badgeEarned) {
      await tx.badge.upsert({
        where: { userId_badgeSlug: { userId, badgeSlug: result.badgeEarned } },
        update: {},
        create: { userId, badgeSlug: result.badgeEarned },
      });
    }
  });

  return result;
}

router.use(authenticate);

// ─── GET / — list user documents ────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.userDocument.findMany({
      where: { userId: req.userId },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = documents.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      type: doc.type.toLowerCase(),
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status.toLowerCase(),
      uploadedAt: doc.uploadedAt.toISOString(),
      reviewedAt: doc.reviewedAt?.toISOString() || null,
      reviewNote: doc.reviewNote,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get documents' });
  }
});

// ─── POST /upload — upload a document ───────────────────────────
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, data: null, message: 'No file uploaded' });
      return;
    }

    const docType = (req.body.type || 'OTHER').toUpperCase();
    const validTypes = ['PASSPORT', 'PHOTO', 'DIPLOMA', 'MEDICAL', 'OTHER'];
    if (!validTypes.includes(docType)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `Invalid document type. Allowed: ${validTypes.join(', ')}`,
      });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const doc = await prisma.userDocument.create({
      data: {
        userId: req.userId!,
        type: docType as any,
        fileName: req.file.originalname,
        fileUrl,
        status: 'PENDING',
      },
    });

    // Auto-complete related quests
    let questResult = null;
    if (docType === 'PASSPORT') {
      questResult = await tryAutoCompleteQuest(req.userId!, 'upload_passport');
    } else if (docType === 'PHOTO') {
      questResult = await tryAutoCompleteQuest(req.userId!, 'upload_photo');
    }

    res.status(201).json({
      success: true,
      data: {
        document: {
          id: doc.id,
          userId: doc.userId,
          type: doc.type.toLowerCase(),
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          status: doc.status.toLowerCase(),
          uploadedAt: doc.uploadedAt.toISOString(),
          reviewedAt: null,
          reviewNote: null,
        },
        questCompleted: questResult
          ? {
              questSlug: docType === 'PASSPORT' ? 'upload_passport' : 'upload_photo',
              xpAwarded: questResult.newXp - (questResult.newXp - (QUESTS.find(
                (q) => q.slug === (docType === 'PASSPORT' ? 'upload_passport' : 'upload_photo')
              )?.xpReward ?? 0)),
              newXp: questResult.newXp,
              newLevel: questResult.newLevel,
              badgeEarned: questResult.badgeEarned || null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to upload document' });
  }
});

// ─── PUT /:id/review — admin review document ───────────────────
const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

router.put('/:id/review', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { status, reviewNote } = parsed.data;

    const doc = await prisma.userDocument.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ success: false, data: null, message: 'Document not found' });
      return;
    }

    const updated = await prisma.userDocument.update({
      where: { id },
      data: {
        status: status as any,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        type: updated.type.toLowerCase(),
        fileName: updated.fileName,
        fileUrl: updated.fileUrl,
        status: updated.status.toLowerCase(),
        uploadedAt: updated.uploadedAt.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString() || null,
        reviewNote: updated.reviewNote,
      },
    });
  } catch (error) {
    console.error('Review document error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to review document' });
  }
});

export default router;
