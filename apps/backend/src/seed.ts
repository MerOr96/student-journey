import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

function generateReferralCode(): string {
  return randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Note: faculties are now managed in Django CRM, not Prisma.

  // ─── Faculties (legacy, kept for reference) ─────────────────────
  // eslint-disable-next-line no-constant-condition
  if (false) { const faculties = [
    {
      slug: 'medicine',
      nameRu: 'Медицинский факультет',
      nameTk: 'Lukmancylyk fakulteti',
      descriptionRu:
        'Подготовка врачей общей практики и узких специалистов. Современные лаборатории и клинические базы. Программа обучения соответствует международным стандартам.',
      descriptionTk:
        'Umumy amaliyyat lukmanlarynyng we dar hunarmenlerning tayyarlanylysy. Dowerebap barlaghanalar we kliniki bazalar. Okuw programmasy halkara standartlaryna layyk gelyar.',
      tuitionPerYear: 200000,
      durationYears: 6,
      imageUrl: null,
    },
    {
      slug: 'engineering',
      nameRu: 'Инженерно-физический факультет высоких технологий',
      nameTk: 'Inzhenerlik fakulteti',
      descriptionRu:
        'Инженерные специальности с практической направленностью. Партнёрства с крупными предприятиями. Стажировки и трудоустройство выпускников.',
      descriptionTk:
        'Amaly ugurly inzhenerlik hunarleri. Uly kaerhanalary bilen hyzmatashlyk. Talyplaryng teyjiribe we ise yerleshme mumkinchilikleri.',
      tuitionPerYear: 160000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'it',
      nameRu: 'Факультет математики, информационных и авиационных технологий',
      nameTk: 'Maglumat tehnologiyalary fakulteti',
      descriptionRu:
        'Программирование, кибербезопасность, искусственный интеллект и анализ данных. Современное оборудование и IT-лаборатории. Высокий спрос на выпускников.',
      descriptionTk:
        'Programmirlemek, kiberhowpsuzlyk, emeli angs we maglumatlary seljerme. Dowerebap enjamlar we IT-barlaghanalar. Utuklere yushka talaply.',
      tuitionPerYear: 180000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'economics',
      nameRu: 'Институт экономики и бизнеса',
      nameTk: 'Ykdysadyyat fakulteti',
      descriptionRu:
        'Экономика, финансы, бухгалтерский учёт и менеджмент. Практические кейсы и стажировки в компаниях. Подготовка к работе в международных организациях.',
      descriptionTk:
        'Ykdysadyyat, maliye, buhgalteriya hasaby we menejmnet. Amaly keyisler we kompaniyalarda teyjiribe. Halkara guramalarda ishlemage tayyarlyk.',
      tuitionPerYear: 140000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'law',
      nameRu: 'Юридический факультет',
      nameTk: 'Hukuk fakulteti',
      descriptionRu:
        'Правоведение, международное право, гражданское и уголовное право. Юридическая клиника для практики. Партнёрство с судебными органами.',
      descriptionTk:
        'Hukuk ylmy, halkara hukugy, rayat we jenayyat hukugy. Tejribe ucin yuridiki klinika. Kazyyet edaralary bilen hyzmatashlyk.',
      tuitionPerYear: 150000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'lingvistics',
      nameRu: 'Факультет лингвистики, межкультурных связей и международных отношений',
      nameTk: 'Filologiya fakulteti',
      descriptionRu:
        'Иностранные языки, лингвистика и переводоведение. Международные обмены и стажировки за рубежом. Подготовка преподавателей и переводчиков.',
      descriptionTk:
        'Rus dili we edebiaty, dashary yurt dilleri, lingwistika we terjimechilik. Halkara alysh-chalyshlary we dashary yurtda teyjiribe. Mugallymlary we terjimechilem tayyarlamak.',
      tuitionPerYear: 120000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'ecology',
      nameRu: 'Факультет экологии',
      nameTk: 'Filologiya fakulteti',
      descriptionRu:
        'Иностранные языки, лингвистика и переводоведение. Международные обмены и стажировки за рубежом. Подготовка преподавателей и переводчиков.',
      descriptionTk:
        'Rus dili we edebiaty, dashary yurt dilleri, lingwistika we terjimechilik. Halkara alysh-chalyshlary we dashary yurtda teyjiribe. Mugallymlary we terjimechilem tayyarlamak.',
      tuitionPerYear: 120000,
      durationYears: 4,
      imageUrl: null,
    },
    {
      slug: 'humanities',
      nameRu: 'Гуманитарный факультет',
      nameTk: 'Filologiya fakulteti',
      descriptionRu:
        'Факультет осуществляет подготовку высококвалифицированных специалистов в сфере социально-гуманитарных наук и технологий.',
      descriptionTk:
        'Fakultet durmuş-ynsanperwer ylymlary we tehnologiýalary ugry boýunça ýokary hünärli hünärmenleri taýýarlaýar.',
      tuitionPerYear: 120000,
      durationYears: 4,
      imageUrl: null,
    },
  ];

  for (const faculty of faculties) {
    await (prisma as any).faculty.upsert({
      where: { slug: faculty.slug },
      update: faculty,
      create: faculty,
    });
  }
  console.log(`Seeded ${faculties.length} faculties`); }



  // ─── Admin User ─────────────────────────────────────────────────
  const adminEmail = 'admin@ulsu.ru';
  const adminPassword = 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      fullName: 'Administrator',
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: 'Administrator',
      role: 'ADMIN',
      language: 'RU',
    },
  });

  // Ensure admin has a player profile (for consistency)
  await prisma.playerProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      xp: 0,
      level: 'beginner',
      referralCode: generateReferralCode(),
    },
  });

  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
