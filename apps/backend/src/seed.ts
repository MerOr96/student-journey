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

  // ─── Faculties ──────────────────────────────────────────────────
  const faculties = [
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
    await prisma.faculty.upsert({
      where: { slug: faculty.slug },
      update: faculty,
      create: faculty,
    });
  }
  console.log(`Seeded ${faculties.length} faculties`);

  // ─── Campus Locations ───────────────────────────────────────────
  const campusLocations = [
    {
      nameRu: 'Главный корпус',
      nameTk: 'Baş bina',
      descriptionRu:
        'Главное административное здание университета. Здесь расположены приёмная комиссия, ректорат и главные аудитории.',
      descriptionTk:
        'Uniwersitetiň bas dolandyrysh binasy. Bu yerde kabul topary, rektorat we esas auditorialar yerleshyar.',
      latitude: 54.3142,
      longitude: 48.4031,
      category: 'ACADEMIC' as const,
      imageUrl: null,
    },
    {
      nameRu: 'Научная библиотека',
      nameTk: 'Ylmy kitaphana',
      descriptionRu:
        'Современная библиотека с более чем 500 000 изданий. Электронные каталоги, залы для самостоятельной работы и компьютерные классы.',
      descriptionTk:
        '500 000-den gowrak neshirleri bolan dowrebap kitaphana. Elektron kataloglar, ozbashdak ish ucin zallar we kompyuter klaslary.',
      latitude: 54.3148,
      longitude: 48.4025,
      category: 'LIBRARY' as const,
      imageUrl: null,
    },
    {
      nameRu: 'Общежитие №1',
      nameTk: 'Yatakhana №1',
      descriptionRu:
        'Комфортабельное общежитие для иностранных студентов. Комнаты на 2-3 человека, кухни на каждом этаже, прачечная и зона отдыха.',
      descriptionTk:
        'Dashary yurtly talyplar ucin amatly yatakhana. 2-3 adamlyk otaglar, her gatda ashhanalar, kir yuwulyan yer we dynch alysh zonaklary.',
      latitude: 54.3155,
      longitude: 48.4010,
      category: 'DORMITORY' as const,
      imageUrl: null,
    },
    {
      nameRu: 'Столовая «Студенческая»',
      nameTk: 'Talyplar naharhanasy',
      descriptionRu:
        'Университетская столовая с доступными ценами. Разнообразное меню, включая вегетарианские и халяльные блюда.',
      descriptionTk:
        'Elyyeterli bahaly uniwersitet naharhanasy. Duerli tagamnamalar, wegetarian we halal naharlary hem bar.',
      latitude: 54.3145,
      longitude: 48.4018,
      category: 'DINING' as const,
      imageUrl: null,
    },
    {
      nameRu: 'Спортивный комплекс',
      nameTk: 'Sport toplumy',
      descriptionRu:
        'Современный спортивный комплекс с тренажёрным залом, бассейном, залами для волейбола и баскетбола. Бесплатный доступ для студентов.',
      descriptionTk:
        'Mashk zaly, basseyn, woleygol we basketbol zallary bolan dowrebap sport toplumy. Talyplara mugt girish.',
      latitude: 54.3138,
      longitude: 48.4042,
      category: 'SPORT' as const,
      imageUrl: null,
    },
  ];

  // Delete existing campus locations and recreate (since they have no unique slug)
  await prisma.campusLocation.deleteMany();
  for (const loc of campusLocations) {
    await prisma.campusLocation.create({ data: loc });
  }
  console.log(`Seeded ${campusLocations.length} campus locations`);

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
