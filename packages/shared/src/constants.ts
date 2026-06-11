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
    minXp: 250,
    icon: '🎓',
  },
  {
    slug: 'documents_submitted',
    title: { ru: 'Документы поданы', tk: 'Resminamalar tabşyryldy' },
    minXp: 400,
    icon: '📄',
  },
  {
    slug: 'accepted_student',
    title: { ru: 'Одобренный кандидат', tk: 'Kabul edilen dalaşgär' },
    minXp: 700,
    icon: '🏆',
  },
];

// ─── Quests ────────────────────────────────────────────────────
export const QUESTS: Quest[] = [
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
    slug: 'join_imo_channel',
    title: {
      ru: 'Подпишись на IMO',
      tk: 'IMO-a agza bol',
    },
    description: {
      ru: 'Вступи в наше сообщество, чтобы узнавать новости первым!',
      tk: 'Täzeliklerden habardar bolmak üçin jemgyýetimize goşul!',
    },
    xpReward: 40,
    requiredLevel: 'applicant',
    badgeSlug: 'community_member',
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
    slug: 'submit_documents',
    title: {
      ru: 'Загрузить аттестат',
      tk: 'Şahadatnama ýükle',
    },
    description: {
      ru: 'Загрузи свой школьный аттестат или диплом',
      tk: 'Mekdep şahadatnamasyny ýa-da diplomyny ýükle',
    },
    xpReward: 200,
    requiredLevel: 'beginner',
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
  {
    slug: 'application_approved',
    title: {
      ru: 'Заявка одобрена',
      tk: 'Ýüzlenme tassyklanyldy',
    },
    description: {
      ru: 'Университет принял ваши документы',
      tk: 'Uniwersitet resminamalaryňyzy kabul etdi',
    },
    xpReward: 200,
    requiredLevel: 'documents_submitted',
    badgeSlug: 'ready_to_go',
  },
];

// ─── Badges ────────────────────────────────────────────────────
export const BADGES: Badge[] = [
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
    slug: 'community_member',
    title: { ru: 'Душа компании', tk: 'Kompaniýanyň ýüregi' },
    description: { ru: 'Подписался на канал IMO', tk: 'IMO kanalyna agza boldy' },
    icon: '💬',
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
