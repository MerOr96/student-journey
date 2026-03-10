import 'dotenv/config';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

async function resetDb() {
  // Keep seed reference data (Faculty, CampusLocation) intact.
  // Clear user-generated tables in FK-safe order.
  await prisma.$transaction([
    prisma.badge.deleteMany(),
    prisma.questCompletion.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.userDocument.deleteMany(),
    prisma.application.deleteMany(),
    prisma.playerProfile.deleteMany(),
    prisma.user.deleteMany({ where: { role: 'USER' } }),
  ]);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Create apps/backend/.env with DATABASE_URL.');
  }

  // Quick connectivity check
  await prisma.$queryRaw`SELECT 1`;
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

