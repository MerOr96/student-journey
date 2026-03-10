import type { LevelSlug, QuestSlug, PlayerProfile, BudgetInput, BudgetBreakdown } from './types';
import { QUESTS, LEVELS, BUDGET_DEFAULTS, getLevelForXp } from './constants';

/**
 * Determines whether a player can start a given quest
 */
export function canStartQuest(profile: PlayerProfile, questSlug: QuestSlug): boolean {
  // Already completed
  if (profile.completedQuests.includes(questSlug)) return false;

  const quest = QUESTS.find((q) => q.slug === questSlug);
  if (!quest) return false;

  // Check level requirement
  const requiredIdx = LEVELS.findIndex((l) => l.slug === quest.requiredLevel);
  const currentIdx = LEVELS.findIndex((l) => l.slug === profile.level);
  return currentIdx >= requiredIdx;
}

/**
 * Processes quest completion: returns new XP and any new badges earned
 */
export function completeQuest(
  profile: PlayerProfile,
  questSlug: QuestSlug
): { newXp: number; newLevel: LevelSlug; badgeEarned?: string } | null {
  if (profile.completedQuests.includes(questSlug)) return null;

  const quest = QUESTS.find((q) => q.slug === questSlug);
  if (!quest) return null;

  const newXp = profile.xp + quest.xpReward;
  const newLevel = getLevelForXp(newXp).slug;

  return {
    newXp,
    newLevel,
    badgeEarned: quest.badgeSlug,
  };
}

/**
 * Calculate referral bonus XP
 */
export function referralBonusXp(currentReferrals: number): number {
  // Diminishing returns: 50 XP for first, then 40, 30, etc., min 10
  return Math.max(10, 50 - (currentReferrals * 10));
}

/**
 * Calculate the full budget breakdown
 */
export function calculateBudget(
  input: BudgetInput,
  tuitionPerYear: number
): BudgetBreakdown {
  const dormitory = input.dormitory ? BUDGET_DEFAULTS.dormitoryPerYear : 0;
  const meals = BUDGET_DEFAULTS.mealPlans[input.mealPlan] * 10; // 10 months academic year
  const insurance = input.insuranceIncluded ? BUDGET_DEFAULTS.insurancePerYear : 0;

  return {
    tuition: tuitionPerYear,
    dormitory,
    meals,
    insurance,
    estimatedMonthlyLiving: BUDGET_DEFAULTS.estimatedMonthlyLiving,
    totalFirstYear: tuitionPerYear + dormitory + meals + insurance + BUDGET_DEFAULTS.estimatedMonthlyLiving * 10,
    currency: 'RUB',
  };
}

/**
 * Get overall completion percentage for a player
 */
export function getOverallProgress(profile: PlayerProfile): number {
  const totalQuests = QUESTS.length;
  return Math.round((profile.completedQuests.length / totalQuests) * 100);
}

/**
 * Generate a referral code from user ID
 */
export function generateReferralCode(userId: string): string {
  const hash = userId.slice(0, 8).toUpperCase();
  return `ULG-${hash}`;
}
