import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Helper: format campus location ─────────────────────────────
function formatLocation(loc: any) {
  return {
    id: loc.id,
    name: { ru: loc.nameRu, tk: loc.nameTk },
    description: { ru: loc.descriptionRu, tk: loc.descriptionTk },
    latitude: loc.latitude,
    longitude: loc.longitude,
    category: loc.category.toLowerCase(),
    imageUrl: loc.imageUrl,
  };
}

// ─── GET / — list all campus locations ──────────────────────────
router.get('/', async (req, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category && typeof category === 'string') {
      const upperCategory = category.toUpperCase();
      const validCategories = ['ACADEMIC', 'DORMITORY', 'DINING', 'SPORT', 'LIBRARY', 'ADMIN'];
      if (validCategories.includes(upperCategory)) {
        where.category = upperCategory;
      }
    }

    const locations = await prisma.campusLocation.findMany({
      where,
      orderBy: { nameRu: 'asc' },
    });

    res.json({
      success: true,
      data: locations.map(formatLocation),
    });
  } catch (error) {
    console.error('Get campus locations error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to get campus locations',
    });
  }
});

export default router;
