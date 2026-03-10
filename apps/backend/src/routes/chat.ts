import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QUESTS, canStartQuest, completeQuest } from '@student-journey/shared';
import type { PlayerProfile as SharedProfile } from '@student-journey/shared';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

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

// ─── Rule-based response generator ──────────────────────────────
function generateAssistantResponse(userMessage: string, lang: string): string {
  const msg = userMessage.toLowerCase();

  // Admission / enrollment keywords
  if (msg.includes('admission') || msg.includes('enroll') || msg.includes('apply') ||
      msg.includes('поступлен') || msg.includes('зачислен') || msg.includes('подать') ||
      msg.includes('kabul') || msg.includes('girmek')) {
    return lang === 'tk'
      ? 'UlGU-a girmek ucin pasportynyzy, diplomynyz we 3x4 suratynyzy tayyarlamaly. Resminamalary yuklap, anketany dolduryng. Soraglarynyz bar bolsa, yazyn!'
      : 'Для поступления в УлГУ вам нужно подготовить паспорт, диплом/аттестат и фото 3x4. Загрузите документы через приложение и заполните анкету. Если есть вопросы — пишите!';
  }

  // Documents keywords
  if (msg.includes('document') || msg.includes('passport') || msg.includes('diploma') ||
      msg.includes('документ') || msg.includes('паспорт') || msg.includes('диплом') ||
      msg.includes('аттестат') || msg.includes('resminama') || msg.includes('pasport')) {
    return lang === 'tk'
      ? 'Gerekli resminamalar: pasport, orta bilim baradaky resminama (diplom/attestat), 3x4 surat we saglygy baradaky kepilnama. Resminamalary \"Resminamalar\" boluminden yuklap bilersiniz.'
      : 'Необходимые документы: паспорт, документ о среднем образовании (диплом/аттестат), фото 3x4 и медицинская справка. Загрузить можно в разделе "Документы".';
  }

  // Faculty keywords
  if (msg.includes('faculty') || msg.includes('specialt') || msg.includes('program') ||
      msg.includes('факультет') || msg.includes('специальн') || msg.includes('направлен') ||
      msg.includes('fakultet') || msg.includes('hunar')) {
    return lang === 'tk'
      ? 'UlGU-da kop fakultetler bar: Lukmancylyk, Inzhenerlik, IT, Ykdysadyyat, Hukuk we Filologiya. Her birinin ayratlyklary barada \"Fakultetler\" boluminde okap bilersiniz. Hunar testini gecip, size laayk fakulteti tapyng!'
      : 'В УлГУ множество факультетов: Медицина, Инженерия, ИТ, Экономика, Право и Филология. Подробности о каждом — в разделе "Факультеты". Пройдите карьерный тест, чтобы найти подходящее направление!';
  }

  // Dormitory / housing keywords
  if (msg.includes('dormi') || msg.includes('housing') || msg.includes('accommod') ||
      msg.includes('общежит') || msg.includes('жиль') || msg.includes('прожив') ||
      msg.includes('yashayys') || msg.includes('yurt')) {
    return lang === 'tk'
      ? 'UlGU talyplara yashaysh jayyny hodorlayar. Yashaysh jayyy bahalary yylda takmynan 15 000 rubl. Yatakhana kampusda yerleshyar we onda ashpezchilik, internet we dusha bar.'
      : 'УлГУ предоставляет общежитие для студентов. Стоимость — около 15 000 рублей в год. Общежитие находится на территории кампуса, есть кухня, интернет и душевые.';
  }

  // Visa keywords
  if (msg.includes('visa') || msg.includes('виза') || msg.includes('wiza') ||
      msg.includes('migration') || msg.includes('миграц')) {
    return lang === 'tk'
      ? 'Russiýa Federasiýasyna okuw wizasyny almak ucin, kabul hatyny aldynyzyzy tassyklamak gerek. Wiza yuztutmasy boyunca konsulhanada maslahat alyp bilersiniz. Kabul hatyny aldanynyzdan son, prosesi bashlamaly.'
      : 'Для получения учебной визы в РФ нужно подтверждение о зачислении (приглашение). Обратитесь в консульство для оформления. После получения приглашения начните процесс подачи документов на визу.';
  }

  // Budget / cost keywords
  if (msg.includes('cost') || msg.includes('price') || msg.includes('budget') || msg.includes('money') || msg.includes('tuition') ||
      msg.includes('стоимост') || msg.includes('цен') || msg.includes('бюджет') || msg.includes('оплат') || msg.includes('деньг') ||
      msg.includes('baha') || msg.includes('tolegler') || msg.includes('byujet')) {
    return lang === 'tk'
      ? 'Okuw tolegleri fakultete gora uytgeyar — yylda 80 000-den 200 000 rubla cenli. Takyk hasaplamak ucin \"Byujet kalkulyatory\" funksiyanyny ulasynyz. Ol yashaysh we naharlanysh chykdajylaryny hem gorukezar.'
      : 'Стоимость обучения зависит от факультета — от 80 000 до 200 000 рублей в год. Используйте "Калькулятор бюджета" для точного расчёта. Он также учитывает проживание и питание.';
  }

  // Greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') ||
      msg.includes('привет') || msg.includes('здравств') ||
      msg.includes('salam') || msg.includes('salawm')) {
    return lang === 'tk'
      ? 'Salam! Men UlGU-nyn wirtual komekcisi. Size postuplyeniye, resminamalar, fakultetler we bashgalar barada komek edip bilerin. Soragynyzy berinyz!'
      : 'Привет! Я виртуальный помощник УлГУ. Могу помочь с вопросами о поступлении, документах, факультетах и многом другом. Задайте свой вопрос!';
  }

  // Default response
  return lang === 'tk'
    ? 'Sag boluny soraganyz ucin! Postuplyeniye, resminamalar, fakultetler, yashaysh, wiza ya-da chykdajylar barada anyk sorag berseniz, has dolulygyna jogap berip bilerin.'
    : 'Спасибо за вопрос! Если вы зададите конкретный вопрос о поступлении, документах, факультетах, проживании, визе или расходах, я смогу дать более подробный ответ.';
}

// ─── GET / — get chat history (with optional pagination) ────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.chatMessage.count({ where: { userId: req.userId } }),
    ]);

    const formatted = messages.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role.toLowerCase(),
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to get chat history' });
  }
});

// ─── POST / — send message and get response ─────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Message content is required',
      });
      return;
    }

    if (content.trim().length > 1000) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Message is too long (max 1000 characters)',
      });
      return;
    }

    const userId = req.userId!;

    // Get user language for response localization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    const lang = user?.language?.toLowerCase() || 'ru';

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'USER',
        content: content.trim(),
      },
    });

    // Generate assistant response
    const assistantContent = generateAssistantResponse(content.trim(), lang);

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'ASSISTANT',
        content: assistantContent,
      },
    });

    // Try to complete chat_with_advisor quest on first message
    let questResult = null;
    const sharedProfile = await buildSharedProfile(userId);
    if (canStartQuest(sharedProfile, 'chat_with_advisor')) {
      const result = completeQuest(sharedProfile, 'chat_with_advisor');
      if (result) {
        const quest = QUESTS.find((q) => q.slug === 'chat_with_advisor')!;
        await prisma.$transaction(async (tx) => {
          await tx.questCompletion.create({
            data: {
              userId,
              questSlug: 'chat_with_advisor',
              xpAwarded: quest.xpReward,
            },
          });

          await tx.playerProfile.update({
            where: { userId },
            data: { xp: result.newXp, level: result.newLevel },
          });

          if (result.badgeEarned) {
            await tx.badge.upsert({
              where: {
                userId_badgeSlug: { userId, badgeSlug: result.badgeEarned },
              },
              update: {},
              create: { userId, badgeSlug: result.badgeEarned },
            });
          }
        });

        questResult = {
          questSlug: 'chat_with_advisor',
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
        userMessage: {
          id: userMessage.id,
          userId: userMessage.userId,
          role: 'user',
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        assistantMessage: {
          id: assistantMessage.id,
          userId: assistantMessage.userId,
          role: 'assistant',
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
        questCompleted: questResult,
      },
    });
  } catch (error) {
    console.error('Send chat error:', error);
    res.status(500).json({ success: false, data: null, message: 'Failed to send message' });
  }
});

export default router;
