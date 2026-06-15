const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany({ where: { pushToken: { not: null } }, select: { email: true, pushToken: true } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
