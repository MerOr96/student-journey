'use client';

import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { localize } from '@student-journey/shared';
import type { Quest, Language } from '@student-journey/shared';

interface QuestCardProps {
  quest: Quest;
  completed: boolean;
  canStart: boolean;
  language?: Language;
  onClick?: () => void;
  className?: string;
}

export default function QuestCard({
  quest,
  completed,
  canStart,
  language = 'ru',
  onClick,
  className,
}: QuestCardProps) {
  const isLocked = !completed && !canStart;

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={clsx(
        'group relative overflow-hidden rounded-xl border p-5 transition-all duration-300',
        completed && 'border-green-200 bg-green-50/50',
        canStart && !completed && 'border-blue-200 bg-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100 cursor-pointer',
        isLocked && 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed',
        'animate-[fadeInUp_0.3s_ease-out_forwards]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {completed && (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
            )}
            {isLocked && (
              <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" />
            )}
            <h3
              className={clsx(
                'text-sm font-semibold',
                completed && 'text-green-700',
                canStart && !completed && 'text-gray-900',
                isLocked && 'text-gray-500',
              )}
            >
              {localize(quest.title, language)}
            </h3>
          </div>
          <p
            className={clsx(
              'mt-1.5 text-xs leading-relaxed',
              completed ? 'text-green-600' : 'text-gray-500',
            )}
          >
            {localize(quest.description, language)}
          </p>
        </div>

        {/* XP Reward Pill */}
        <div
          className={clsx(
            'flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
            completed && 'bg-green-100 text-green-700',
            canStart && !completed && 'bg-blue-100 text-blue-700',
            isLocked && 'bg-gray-100 text-gray-400',
          )}
        >
          +{quest.xpReward} XP
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={clsx(
            'text-xs font-medium',
            completed && 'text-green-600',
            canStart && !completed && 'text-blue-600',
            isLocked && 'text-gray-400',
          )}
        >
          {completed
            ? language === 'ru'
              ? 'Выполнено'
              : 'Ýerine ýetirildi'
            : isLocked
              ? language === 'ru'
                ? 'Заблокировано'
                : 'Bloklanan'
              : language === 'ru'
                ? 'Доступно'
                : 'Elýeterli'}
        </span>

        {canStart && !completed && (
          <div className="flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{language === 'ru' ? 'Начать' : 'Başla'}</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
