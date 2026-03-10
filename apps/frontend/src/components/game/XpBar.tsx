'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  getLevelForXp,
  getNextLevel,
  getXpProgressPercent,
  localize,
} from '@student-journey/shared';
import type { Language, LevelSlug } from '@student-journey/shared';

interface XpBarProps {
  xp: number;
  animated?: boolean;
  language?: Language;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelColorMap: Record<LevelSlug, string> = {
  beginner: 'from-green-400 to-green-600',
  applicant: 'from-blue-400 to-blue-600',
  future_student: 'from-purple-400 to-purple-600',
  documents_submitted: 'from-amber-400 to-amber-600',
  accepted_student: 'from-yellow-400 to-yellow-600',
};

const sizeMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function XpBar({
  xp,
  animated = true,
  language = 'ru',
  showLabel = true,
  size = 'md',
  className,
}: XpBarProps) {
  const [displayPercent, setDisplayPercent] = useState(animated ? 0 : getXpProgressPercent(xp));
  const level = getLevelForXp(xp);
  const nextLevel = getNextLevel(level.slug);
  const targetPercent = getXpProgressPercent(xp);
  const colorGradient = levelColorMap[level.slug] || levelColorMap.beginner;

  useEffect(() => {
    if (!animated) {
      setDisplayPercent(targetPercent);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayPercent(targetPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercent, animated]);

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">
            {xp} XP
          </span>
          {nextLevel ? (
            <span className="text-gray-500">
              {localize(nextLevel.title, language)} &mdash; {nextLevel.minXp} XP
            </span>
          ) : (
            <span className="font-semibold text-amber-600">MAX</span>
          )}
        </div>
      )}
      <div className={clsx('relative w-full overflow-hidden rounded-full bg-gray-200', sizeMap[size])}>
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-all ease-out',
            colorGradient,
            animated ? 'duration-1000' : 'duration-0',
          )}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      {showLabel && nextLevel && (
        <div className="mt-1 text-right text-[10px] text-gray-400">
          {targetPercent}%
        </div>
      )}
    </div>
  );
}
