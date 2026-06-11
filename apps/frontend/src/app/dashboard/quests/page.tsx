'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import {
  QUESTS,
  getOverallProgress,
  canStartQuest,
  localize,
} from '@student-journey/shared';
import type { QuestSlug } from '@student-journey/shared';
import QuestCard from '@/components/game/QuestCard';
import AchievementPopup from '@/components/game/AchievementPopup';

const questRouteMap: Partial<Record<QuestSlug, string>> = {
  upload_passport: '/dashboard/documents',
  choose_faculty: '/dashboard/faculties',
  career_quiz: '/dashboard/quiz',
  join_imo_channel: '/dashboard/quests',
  chat_with_advisor: '/dashboard/chat',

  submit_documents: '/dashboard/documents',
};

export default function QuestsPage() {
  const { user, language } = useAuth();
  const { profile, completeQuest } = useGame();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [achievement, setAchievement] = useState<{
    type: 'quest' | 'badge' | 'level_up';
    title: string;
    description?: string;
    icon?: string;
  } | null>(null);

  const handleQuestClick = useCallback(
    async (questSlug: QuestSlug) => {
      if (questSlug === 'invite_friend') {
        return; // Handled by the copy button inside the card
      }
      if (questSlug === 'join_imo_channel') {
        window.open('https://s.channelcom.tech/HdAdii?from=TG', '_blank');
        if (profile && !profile.completedQuests.includes('join_imo_channel')) {
          await completeQuest('join_imo_channel');
          const quest = QUESTS.find((q) => q.slug === 'join_imo_channel');
          if (quest) {
            setAchievement({
              type: 'quest',
              title: localize(quest.title, language),
              description: `+${quest.xpReward} XP`,
              icon: '💬',
            });
          }
        }
        return;
      }
      const route = questRouteMap[questSlug];
      if (route) {
        router.push(route);
      }
    },
    [router, profile, completeQuest, language],
  );

  const handleCopyReferral = useCallback(async () => {
    if (!profile) return;
    const shareLink = `${window.location.origin}/register`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // If quest not completed, complete it
      if (!profile.completedQuests.includes('invite_friend')) {
        await completeQuest('invite_friend');
        const quest = QUESTS.find((q) => q.slug === 'invite_friend');
        if (quest) {
          setAchievement({
            type: 'quest',
            title: localize(quest.title, language),
            description: `+${quest.xpReward} XP`,
            icon: '🦋',
          });
        }
      }
    } catch {
      // Fallback: create a textarea and copy
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [profile, completeQuest, language]);

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="spinner h-8 w-8" />
      </div>
    );
  }

  const overallProgress = getOverallProgress(profile);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Trophy className="h-6 w-6 text-primary-600" />
            {language === 'ru' ? 'Твои квесты' : 'Seniň kwestleriň'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {language === 'ru'
              ? 'Выполняй квесты и зарабатывай опыт'
              : 'Kwestleri ýerine ýetir we tejribe gazany'}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="flex items-center gap-3 rounded-lg bg-primary-50 px-4 py-2.5">
          <div className="text-right">
            <p className="text-xs text-primary-600">
              {language === 'ru' ? 'Общий прогресс' : 'Umumy ilerleyis'}
            </p>
            <p className="text-lg font-bold text-primary-700">{overallProgress}%</p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full">
            <svg className="-rotate-90" viewBox="0 0 36 36" width="40" height="40">
              <path
                className="text-primary-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-primary-600"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={`${overallProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Quest Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {QUESTS.map((quest) => {
          const completed = profile.completedQuests.includes(quest.slug);
          const startable = canStartQuest(profile, quest.slug);

          if (quest.slug === 'invite_friend') {
            return (
              <div key={quest.slug} className="relative">
                <QuestCard
                  quest={quest}
                  completed={completed}
                  canStart={startable}
                  language={language}
                  onClick={() => {}}
                />
                {!completed && startable && (
                  <div className="absolute bottom-3 right-5">
                    <button
                      onClick={handleCopyReferral}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {language === 'ru' ? 'Скопировано!' : 'Gocurildi!'}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          {language === 'ru' ? 'Копировать ссылку' : 'Baglanyshygy göçür'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <QuestCard
              key={quest.slug}
              quest={quest}
              completed={completed}
              canStart={startable}
              language={language}
              onClick={() => handleQuestClick(quest.slug)}
            />
          );
        })}
      </div>

      {/* Achievement Popup */}
      {achievement && (
        <AchievementPopup
          type={achievement.type}
          title={achievement.title}
          description={achievement.description}
          icon={achievement.icon}
          onClose={() => setAchievement(null)}
        />
      )}
    </div>
  );
}
