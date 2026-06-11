const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Notifications:', JSON.stringify(notifs, null, 2));
  
  const exams = await prisma.exam.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Exams:', JSON.stringify(exams, null, 2));
}

main().finally(() => prisma.$disconnect());
