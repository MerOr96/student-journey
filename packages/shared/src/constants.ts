import type { Level, Quest, Badge, LevelSlug, Language, VelayatOption } from './types';

// ─── Levels ────────────────────────────────────────────────────
export const LEVELS: Level[] = [
  {
    slug: 'beginner',
    title: { ru: 'Новичок', tk: 'Täze başlaýan' },
    minXp: 0,
    icon: '🌱',
  },
  {
    slug: 'applicant',
    title: { ru: 'Абитуриент', tk: 'Dalaşgär' },
    minXp: 100,
    icon: '📝',
  },
  {
    slug: 'future_student',
    title: { ru: 'Будущий студент', tk: 'Geljekki talyp' },
    minXp: 300,
    icon: '🎓',
  },
  {
    slug: 'documents_submitted',
    title: { ru: 'Документы поданы', tk: 'Resminamalar tabşyryldy' },
    minXp: 600,
    icon: '📄',
  },
  {
    slug: 'accepted_student',
    title: { ru: 'Зачисленный студент', tk: 'Kabul edilen talyp' },
    minXp: 1000,
    icon: '🏆',
  },
];

// ─── Quests ────────────────────────────────────────────────────
export const QUESTS: Quest[] = [
  {
    slug: 'fill_personal_info',
    title: {
      ru: 'Заполни анкету',
      tk: 'Anketany doldur',
    },
    description: {
      ru: 'Заполни свои персональные данные в профиле',
      tk: 'Profilde şahsy maglumatlaryňy doldur',
    },
    xpReward: 30,
    requiredLevel: 'beginner',
    badgeSlug: 'first_step',
  },
  {
    slug: 'upload_passport',
    title: {
      ru: 'Загрузи паспорт',
      tk: 'Pasporty ýükle',
    },
    description: {
      ru: 'Загрузи скан своего паспорта для подачи документов',
      tk: 'Resminamalary tabşyrmak üçin pasportyňyň skanirlenen görnüşini ýükle',
    },
    xpReward: 50,
    requiredLevel: 'beginner',
    badgeSlug: 'document_master',
  },
  {
    slug: 'choose_faculty',
    title: {
      ru: 'Выбери факультет',
      tk: 'Fakulteti saýla',
    },
    description: {
      ru: 'Изучи факультеты и выбери свой',
      tk: 'Fakultetleri öwren we özüňkini saýla',
    },
    xpReward: 40,
    requiredLevel: 'beginner',
    badgeSlug: 'explorer',
  },
  {
    slug: 'career_quiz',
    title: {
      ru: 'Пройди карьерный тест',
      tk: 'Hünär testini geç',
    },
    description: {
      ru: 'Узнай, какой факультет тебе подходит',
      tk: 'Haýsy fakultetiň saňa laýykdygyny bil',
    },
    xpReward: 60,
    requiredLevel: 'beginner',
    badgeSlug: 'quiz_champion',
  },
  {
    slug: 'calculate_budget',
    title: {
      ru: 'Рассчитай бюджет',
      tk: 'Býujety hasapla',
    },
    description: {
      ru: 'Используй калькулятор, чтобы спланировать расходы',
      tk: 'Çykdajylary meýilleşdirmek üçin kalkulýatory ulan',
    },
    xpReward: 40,
    requiredLevel: 'applicant',
    badgeSlug: 'budget_planner',
  },
  {
    slug: 'chat_with_advisor',
    title: {
      ru: 'Поговори с AI-помощником',
      tk: 'AI-kömekçi bilen söhbet et',
    },
    description: {
      ru: 'Задай вопрос нашему умному помощнику',
      tk: 'Akylly kömekçimize sorag ber',
    },
    xpReward: 30,
    requiredLevel: 'beginner',
    badgeSlug: 'ai_friend',
  },
  {
    slug: 'upload_photo',
    title: {
      ru: 'Загрузи фото',
      tk: 'Surat ýükle',
    },
    description: {
      ru: 'Загрузи своё фото 3×4 для документов',
      tk: 'Resminamalar üçin 3×4 suratyňy ýükle',
    },
    xpReward: 30,
    requiredLevel: 'applicant',
  },
  {
    slug: 'submit_documents',
    title: {
      ru: 'Подай документы',
      tk: 'Resminamalary tabşyr',
    },
    description: {
      ru: 'Отправь все документы на рассмотрение',
      tk: 'Ähli resminamalary garamak üçin iber',
    },
    xpReward: 200,
    requiredLevel: 'future_student',
    badgeSlug: 'ready_to_go',
  },
  {
    slug: 'invite_friend',
    title: {
      ru: 'Пригласи друга',
      tk: 'Dostuňy çagyr',
    },
    description: {
      ru: 'Поделись реферальной ссылкой с другом',
      tk: 'Salgylanma baglanyşygyny dostuň bilen paýlaş',
    },
    xpReward: 80,
    requiredLevel: 'beginner',
    badgeSlug: 'social_butterfly',
  },
];

// ─── Badges ────────────────────────────────────────────────────
export const BADGES: Badge[] = [
  {
    slug: 'first_step',
    title: { ru: 'Первый шаг', tk: 'Birinji ädim' },
    description: { ru: 'Заполнил анкету', tk: 'Anketany doldurdy' },
    icon: '👣',
  },
  {
    slug: 'document_master',
    title: { ru: 'Мастер документов', tk: 'Resminama ussady' },
    description: { ru: 'Загрузил паспорт', tk: 'Pasporty ýükledi' },
    icon: '📋',
  },
  {
    slug: 'explorer',
    title: { ru: 'Исследователь', tk: 'Gözlegçi' },
    description: { ru: 'Выбрал факультет', tk: 'Fakulteti saýlady' },
    icon: '🔍',
  },
  {
    slug: 'social_butterfly',
    title: { ru: 'Социальная бабочка', tk: 'Jemgyýetçi' },
    description: { ru: 'Пригласил друга', tk: 'Dostuny çagyrdy' },
    icon: '🦋',
  },
  {
    slug: 'quiz_champion',
    title: { ru: 'Чемпион теста', tk: 'Test çempiony' },
    description: { ru: 'Прошёл карьерный тест', tk: 'Hünär testini geçdi' },
    icon: '🏅',
  },
  {
    slug: 'budget_planner',
    title: { ru: 'Финансист', tk: 'Maliýeçi' },
    description: { ru: 'Рассчитал бюджет', tk: 'Býujety hasaplady' },
    icon: '💰',
  },
  {
    slug: 'ai_friend',
    title: { ru: 'Друг ИИ', tk: 'AI dosty' },
    description: { ru: 'Поговорил с AI-помощником', tk: 'AI-kömekçi bilen söhbet etdi' },
    icon: '🤖',
  },
  {
    slug: 'ready_to_go',
    title: { ru: 'Готов к поступлению', tk: 'Girmäge taýýar' },
    description: { ru: 'Подал все документы', tk: 'Ähli resminamalary tabşyrdy' },
    icon: '🚀',
  },
];

// ─── Velayats (Turkmen provinces) ──────────────────────────────
export const VELAYATS: VelayatOption[] = [
  { slug: 'ahal', name: { ru: 'Ахалский велаят', tk: 'Ahal welaýaty' } },
  { slug: 'balkan', name: { ru: 'Балканский велаят', tk: 'Balkan welaýaty' } },
  { slug: 'dashoguz', name: { ru: 'Дашогузский велаят', tk: 'Daşoguz welaýaty' } },
  { slug: 'lebap', name: { ru: 'Лебапский велаят', tk: 'Lebap welaýaty' } },
  { slug: 'mary', name: { ru: 'Марыйский велаят', tk: 'Mary welaýaty' } },
  { slug: 'ashgabat', name: { ru: 'Ашхабад', tk: 'Aşgabat şäheri' } },
];

// ─── Budget Defaults ───────────────────────────────────────────
export const BUDGET_DEFAULTS = {
  dormitoryPerYear: 15000, // RUB
  mealPlans: {
    basic: 4000,      // RUB/month
    standard: 7000,
    premium: 12000,
  },
  insurancePerYear: 8000,  // RUB
  estimatedMonthlyLiving: 15000,
};

// ─── Helpers ───────────────────────────────────────────────────
export function getLevelForXp(xp: number): Level {
  const sorted = [...LEVELS].sort((a, b) => b.minXp - a.minXp);
  return sorted.find((l) => xp >= l.minXp) ?? LEVELS[0];
}

export function getNextLevel(currentSlug: LevelSlug): Level | null {
  const idx = LEVELS.findIndex((l) => l.slug === currentSlug);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getXpProgressPercent(xp: number): number {
  const current = getLevelForXp(xp);
  const next = getNextLevel(current.slug);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function localize<T>(obj: Record<Language, T>, lang: Language): T {
  return obj[lang] ?? obj['ru'];
}
