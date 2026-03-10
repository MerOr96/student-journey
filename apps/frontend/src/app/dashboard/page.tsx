'use client';

import React from 'react';
import Link from 'next/link';
import {
  Upload,
  BrainCircuit,
  MessageCircle,
  ChevronRight,
  Target,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import {
  getLevelForXp,
  getOverallProgress,
  localize,
  QUESTS,
  BADGES,
  canStartQuest,
} from '@student-journey/shared';
import type { QuestSlug } from '@student-journey/shared';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import XpBar from '@/components/game/XpBar';
import LevelBadge from '@/components/game/LevelBadge';

export default function DashboardPage() {
  const { user, language } = useAuth();
  const { profile } = useGame();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="spinner h-8 w-8" />
      </div>
    );
  }

  const level = getLevelForXp(profile.xp);
  const overallProgress = getOverallProgress(profile);

  // Get next 3 available quests (not completed, can start)
  const availableQuests = QUESTS
    .filter(
      (q) =>
        !profile.completedQuests.includes(q.slug) &&
        canStartQuest(profile, q.slug),
    )
    .slice(0, 3);

  // Get last 3 earned badges
  const earnedBadges = BADGES
    .filter((b) => profile.badges.includes(b.slug))
    .slice(-3);

  const questRouteMap: Partial<Record<QuestSlug, string>> = {
    upload_passport: '/dashboard/documents',
    choose_faculty: '/dashboard/faculties',
    career_quiz: '/dashboard/quiz',
    calculate_budget: '/dashboard/budget',
    chat_with_advisor: '/dashboard/chat',
    upload_photo: '/dashboard/documents',
    fill_personal_info: '/dashboard/quests',
    submit_documents: '/dashboard/documents',
    invite_friend: '/dashboard/quests',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'ru'
            ? `${user.fullName}!`
            : `Salam, ${user.fullName}!`}
          {language === 'ru' && (
            <span className="ml-1">
              {new Date().getHours() < 12
                ? 'Доброе утро'
                : new Date().getHours() < 18
                  ? 'Добрый день'
                  : 'Добрый вечер'}
              {', '}
            </span>
          )}
        </h1>
        <p className="mt-1 text-gray-500">
          {language === 'ru'
            ? 'Вот что происходит с твоим путешествием'
            : 'Syýahatyňyzdaky ýagdaý'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Current Level Card */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute right-3 top-3 text-3xl opacity-20">
            {level.icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {language === 'ru' ? 'Текущий уровень' : 'Hakyky dereje'}
          </p>
          <div className="mt-2">
            <LevelBadge xp={profile.xp} language={language} size="md" />
          </div>
          <div className="mt-3">
            <XpBar xp={profile.xp} language={language} size="sm" />
          </div>
        </Card>

        {/* Overall Progress Card */}
        <Card padding="md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {language === 'ru' ? 'Общий прогресс' : 'Umumy ilerleyis'}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary-500 transition-all duration-1000 ease-out"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${overallProgress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {overallProgress}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {profile.completedQuests.length} / {QUESTS.length}
              </p>
              <p className="text-xs text-gray-500">
                {language === 'ru' ? 'квестов выполнено' : 'kwest ýerine ýetirildi'}
              </p>
            </div>
          </div>
        </Card>

        {/* XP Card */}
        <Card padding="md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {language === 'ru' ? 'Очки опыта' : 'Tejribe ballary'}
          </p>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {profile.xp} <span className="text-base font-medium text-gray-400">XP</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {language === 'ru' ? 'Значки:' : 'Nyshan:'}{' '}
            <span className="font-semibold text-gray-700">{profile.badges.length}</span>
          </p>
        </Card>
      </div>

      {/* Active Quests Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {language === 'ru' ? 'Активные квесты' : 'Isjenan kwestler'}
          </h2>
          <Link
            href="/dashboard/quests"
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {language === 'ru' ? 'Все квесты' : 'Ähli kwestler'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {availableQuests.length === 0 ? (
          <Card padding="md">
            <div className="flex flex-col items-center py-4 text-center">
              <Target className="h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {language === 'ru'
                  ? 'Все доступные квесты выполнены!'
                  : 'Ähli elýeterli kwestler ýerine ýetirildi!'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableQuests.map((quest) => (
              <Link
                key={quest.slug}
                href={questRouteMap[quest.slug] || '/dashboard/quests'}
              >
                <Card hover padding="md" className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {localize(quest.title, language)}
                    </h3>
                    <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                      +{quest.xpReward} XP
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
                    {localize(quest.description, language)}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                    {language === 'ru' ? 'Начать' : 'Başla'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Badges Section */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {language === 'ru' ? 'Последние значки' : 'Sonky nyshan'}
        </h2>
        {earnedBadges.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-sm text-gray-500">
              {language === 'ru'
                ? 'Ещё нет значков. Выполняй квесты, чтобы получить!'
                : 'Entek nysan yok. Kwestleri ýerine yetir!'}
            </p>
          </Card>
        ) : (
          <div className="flex gap-6">
            {earnedBadges.map((badge) => (
              <Badge
                key={badge.slug}
                icon={badge.icon}
                title={localize(badge.title, language)}
                earned
                size="lg"
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {language === 'ru' ? 'Быстрые действия' : 'Calt hereketler'}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/documents">
            <Button variant="outline" size="md">
              <Upload className="h-4 w-4" />
              {language === 'ru' ? 'Загрузить документ' : 'Resminama ýükle'}
            </Button>
          </Link>
          <Link href="/dashboard/quiz">
            <Button variant="outline" size="md">
              <BrainCircuit className="h-4 w-4" />
              {language === 'ru' ? 'Пройти тест' : 'Test geç'}
            </Button>
          </Link>
          <Link href="/dashboard/chat">
            <Button variant="outline" size="md">
              <MessageCircle className="h-4 w-4" />
              {language === 'ru' ? 'Чат с помощником' : 'Kömekçi bilen söhbet'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
