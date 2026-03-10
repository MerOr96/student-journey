import { describe, it, expect } from 'vitest';
import {
  canStartQuest,
  completeQuest,
  referralBonusXp,
  calculateBudget,
  getOverallProgress,
  generateReferralCode,
} from '../game-logic';
import {
  getLevelForXp,
  getNextLevel,
  getXpProgressPercent,
  localize,
  LEVELS,
  QUESTS,
  BADGES,
  BUDGET_DEFAULTS,
} from '../constants';
import type { PlayerProfile } from '../types';

// ─── Helper ──────────────────────────────────────────────────────
function makeProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    userId: 'test-user-id-12345678',
    xp: 0,
    level: 'beginner',
    completedQuests: [],
    badges: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. getLevelForXp
// ═══════════════════════════════════════════════════════════════════
describe('getLevelForXp', () => {
  it('should return beginner for 0 XP', () => {
    const level = getLevelForXp(0);
    expect(level.slug).toBe('beginner');
  });

  it('should return beginner for 99 XP', () => {
    const level = getLevelForXp(99);
    expect(level.slug).toBe('beginner');
  });

  it('should return applicant for 100 XP', () => {
    const level = getLevelForXp(100);
    expect(level.slug).toBe('applicant');
  });

  it('should return future_student for 300 XP', () => {
    const level = getLevelForXp(300);
    expect(level.slug).toBe('future_student');
  });

  it('should return documents_submitted for 600 XP', () => {
    const level = getLevelForXp(600);
    expect(level.slug).toBe('documents_submitted');
  });

  it('should return accepted_student for 1000 XP', () => {
    const level = getLevelForXp(1000);
    expect(level.slug).toBe('accepted_student');
  });

  it('should return accepted_student for very high XP (5000)', () => {
    const level = getLevelForXp(5000);
    expect(level.slug).toBe('accepted_student');
  });

  it('should return beginner for negative XP', () => {
    const level = getLevelForXp(-10);
    expect(level.slug).toBe('beginner');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. getNextLevel
// ═══════════════════════════════════════════════════════════════════
describe('getNextLevel', () => {
  it('should return applicant as next level after beginner', () => {
    const next = getNextLevel('beginner');
    expect(next).not.toBeNull();
    expect(next!.slug).toBe('applicant');
  });

  it('should return null for the maximum level', () => {
    const next = getNextLevel('accepted_student');
    expect(next).toBeNull();
  });

  it('should return future_student after applicant', () => {
    const next = getNextLevel('applicant');
    expect(next!.slug).toBe('future_student');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. getXpProgressPercent
// ═══════════════════════════════════════════════════════════════════
describe('getXpProgressPercent', () => {
  it('should return 0% at the start of beginner level', () => {
    expect(getXpProgressPercent(0)).toBe(0);
  });

  it('should return 50% halfway through beginner (0-100)', () => {
    expect(getXpProgressPercent(50)).toBe(50);
  });

  it('should return 100% for maximum level', () => {
    expect(getXpProgressPercent(1000)).toBe(100);
  });

  it('should return 100% for XP above maximum level', () => {
    expect(getXpProgressPercent(9999)).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. canStartQuest
// ═══════════════════════════════════════════════════════════════════
describe('canStartQuest', () => {
  it('should allow beginner to start fill_personal_info quest', () => {
    const profile = makeProfile();
    expect(canStartQuest(profile, 'fill_personal_info')).toBe(true);
  });

  it('should not allow starting an already completed quest', () => {
    const profile = makeProfile({ completedQuests: ['fill_personal_info'] });
    expect(canStartQuest(profile, 'fill_personal_info')).toBe(false);
  });

  it('should not allow beginner to start calculate_budget (requires applicant)', () => {
    const profile = makeProfile({ level: 'beginner' });
    expect(canStartQuest(profile, 'calculate_budget')).toBe(false);
  });

  it('should allow applicant to start calculate_budget', () => {
    const profile = makeProfile({ level: 'applicant', xp: 100 });
    expect(canStartQuest(profile, 'calculate_budget')).toBe(true);
  });

  it('should return false for nonexistent quest slug', () => {
    const profile = makeProfile();
    expect(canStartQuest(profile, 'nonexistent_quest' as any)).toBe(false);
  });

  it('should not allow beginner to start submit_documents (requires future_student)', () => {
    const profile = makeProfile({ level: 'beginner' });
    expect(canStartQuest(profile, 'submit_documents')).toBe(false);
  });

  it('should allow future_student to start submit_documents', () => {
    const profile = makeProfile({ level: 'future_student', xp: 300 });
    expect(canStartQuest(profile, 'submit_documents')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. completeQuest
// ═══════════════════════════════════════════════════════════════════
describe('completeQuest', () => {
  it('should return new XP after completing a quest', () => {
    const profile = makeProfile();
    const result = completeQuest(profile, 'fill_personal_info');
    expect(result).not.toBeNull();
    expect(result!.newXp).toBe(30); // 0 + 30 XP reward
  });

  it('should return correct badge for quest with badge', () => {
    const profile = makeProfile();
    const result = completeQuest(profile, 'fill_personal_info');
    expect(result!.badgeEarned).toBe('first_step');
  });

  it('should return null for already completed quest', () => {
    const profile = makeProfile({ completedQuests: ['fill_personal_info'] });
    const result = completeQuest(profile, 'fill_personal_info');
    expect(result).toBeNull();
  });

  it('should return null for nonexistent quest', () => {
    const profile = makeProfile();
    const result = completeQuest(profile, 'fake_quest' as any);
    expect(result).toBeNull();
  });

  it('should calculate correct level after XP gain', () => {
    const profile = makeProfile({ xp: 90 });
    const result = completeQuest(profile, 'upload_passport');
    expect(result).not.toBeNull();
    expect(result!.newXp).toBe(140); // 90 + 50
    expect(result!.newLevel).toBe('applicant'); // 140 >= 100
  });

  it('should not change level if XP threshold not reached', () => {
    const profile = makeProfile({ xp: 0 });
    const result = completeQuest(profile, 'fill_personal_info');
    expect(result!.newXp).toBe(30);
    expect(result!.newLevel).toBe('beginner'); // 30 < 100
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. referralBonusXp
// ═══════════════════════════════════════════════════════════════════
describe('referralBonusXp', () => {
  it('should return 50 XP for first referral (0 existing)', () => {
    expect(referralBonusXp(0)).toBe(50);
  });

  it('should return 40 XP for second referral', () => {
    expect(referralBonusXp(1)).toBe(40);
  });

  it('should return 30 XP for third referral', () => {
    expect(referralBonusXp(2)).toBe(30);
  });

  it('should never go below 10 XP minimum', () => {
    expect(referralBonusXp(10)).toBe(10);
    expect(referralBonusXp(100)).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. calculateBudget
// ═══════════════════════════════════════════════════════════════════
describe('calculateBudget', () => {
  const tuition = 120000;

  it('should calculate basic budget without dormitory and insurance', () => {
    const result = calculateBudget(
      { facultySlug: 'it', dormitory: false, mealPlan: 'basic', insuranceIncluded: false },
      tuition
    );
    expect(result.tuition).toBe(120000);
    expect(result.dormitory).toBe(0);
    expect(result.insurance).toBe(0);
    expect(result.meals).toBe(BUDGET_DEFAULTS.mealPlans.basic * 10);
    expect(result.currency).toBe('RUB');
  });

  it('should include dormitory cost when enabled', () => {
    const result = calculateBudget(
      { facultySlug: 'it', dormitory: true, mealPlan: 'basic', insuranceIncluded: false },
      tuition
    );
    expect(result.dormitory).toBe(BUDGET_DEFAULTS.dormitoryPerYear);
  });

  it('should include insurance cost when enabled', () => {
    const result = calculateBudget(
      { facultySlug: 'it', dormitory: false, mealPlan: 'basic', insuranceIncluded: true },
      tuition
    );
    expect(result.insurance).toBe(BUDGET_DEFAULTS.insurancePerYear);
  });

  it('should calculate correct totalFirstYear with all options', () => {
    const result = calculateBudget(
      { facultySlug: 'it', dormitory: true, mealPlan: 'premium', insuranceIncluded: true },
      tuition
    );
    const expected =
      tuition +
      BUDGET_DEFAULTS.dormitoryPerYear +
      BUDGET_DEFAULTS.mealPlans.premium * 10 +
      BUDGET_DEFAULTS.insurancePerYear +
      BUDGET_DEFAULTS.estimatedMonthlyLiving * 10;
    expect(result.totalFirstYear).toBe(expected);
  });

  it('should calculate different meal plan costs', () => {
    const basic = calculateBudget(
      { facultySlug: 'it', dormitory: false, mealPlan: 'basic', insuranceIncluded: false },
      tuition
    );
    const premium = calculateBudget(
      { facultySlug: 'it', dormitory: false, mealPlan: 'premium', insuranceIncluded: false },
      tuition
    );
    expect(premium.meals).toBeGreaterThan(basic.meals);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. getOverallProgress
// ═══════════════════════════════════════════════════════════════════
describe('getOverallProgress', () => {
  it('should return 0% for no completed quests', () => {
    const profile = makeProfile();
    expect(getOverallProgress(profile)).toBe(0);
  });

  it('should return correct percentage for partial completion', () => {
    const profile = makeProfile({ completedQuests: ['fill_personal_info', 'upload_passport'] });
    // 2/9 = 22.2% → rounded to 22
    expect(getOverallProgress(profile)).toBe(22);
  });

  it('should return 100% when all quests completed', () => {
    const allSlugs = QUESTS.map((q) => q.slug);
    const profile = makeProfile({ completedQuests: allSlugs });
    expect(getOverallProgress(profile)).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. generateReferralCode
// ═══════════════════════════════════════════════════════════════════
describe('generateReferralCode', () => {
  it('should start with ULG- prefix', () => {
    const code = generateReferralCode('abcdef12-3456-7890-abcd-ef1234567890');
    expect(code.startsWith('ULG-')).toBe(true);
  });

  it('should return uppercase characters after prefix', () => {
    const code = generateReferralCode('abcdef12-3456-7890-abcd-ef1234567890');
    const suffix = code.slice(4);
    expect(suffix).toBe(suffix.toUpperCase());
  });

  it('should generate 8-character hash from userId', () => {
    const code = generateReferralCode('abcdef12-3456-7890-abcd-ef1234567890');
    const suffix = code.slice(4);
    expect(suffix.length).toBe(8);
  });

  it('should generate different codes for different userIds', () => {
    const code1 = generateReferralCode('user-aaaa-1111');
    const code2 = generateReferralCode('user-bbbb-2222');
    expect(code1).not.toBe(code2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. localize
// ═══════════════════════════════════════════════════════════════════
describe('localize', () => {
  it('should return Russian text for "ru" language', () => {
    const result = localize({ ru: 'Привет', tk: 'Salam' }, 'ru');
    expect(result).toBe('Привет');
  });

  it('should return Turkmen text for "tk" language', () => {
    const result = localize({ ru: 'Привет', tk: 'Salam' }, 'tk');
    expect(result).toBe('Salam');
  });

  it('should fallback to Russian for unknown language', () => {
    const result = localize({ ru: 'Привет', tk: 'Salam' }, 'en' as any);
    expect(result).toBe('Привет');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. Constants integrity
// ═══════════════════════════════════════════════════════════════════
describe('Constants integrity', () => {
  it('should have 5 levels defined', () => {
    expect(LEVELS.length).toBe(5);
  });

  it('should have 9 quests defined', () => {
    expect(QUESTS.length).toBe(9);
  });

  it('should have 8 badges defined', () => {
    expect(BADGES.length).toBe(8);
  });

  it('levels should be sorted by ascending minXp', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
    }
  });

  it('every quest with a badgeSlug should reference an existing badge', () => {
    const badgeSlugs = BADGES.map((b) => b.slug);
    QUESTS.forEach((quest) => {
      if (quest.badgeSlug) {
        expect(badgeSlugs).toContain(quest.badgeSlug);
      }
    });
  });

  it('every quest requiredLevel should reference an existing level', () => {
    const levelSlugs = LEVELS.map((l) => l.slug);
    QUESTS.forEach((quest) => {
      expect(levelSlugs).toContain(quest.requiredLevel);
    });
  });
});
