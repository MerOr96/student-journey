import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── GET / — top 50 players by XP (admin only) ─────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check admin role
    const requestingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, data: null, message: 'Admin access required' });
      return;
    }
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: 'Authorization failed' });
    return;
  }
  try {
    const profiles = await prisma.playerProfile.findMany({
      take: 50,
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

    // Get badge counts for all users in the leaderboard
    const userIds = profiles.map((p) => p.userId);
    const badgeCounts = await prisma.badge.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });

    const badgeCountMap = new Map<string, number>();
    badgeCounts.forEach((bc) => {
      badgeCountMap.set(bc.userId, bc._count.id);
    });

    const leaderboard = profiles
      .filter((p) => p.user.role !== 'ADMIN') // Exclude admins from leaderboard
      .map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        xp: p.xp,
        level: p.level,
        badgeCount: badgeCountMap.get(p.userId) || 0,
      }));

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get leaderboard' });
  }
});

export default router;
