'use client';

import React from 'react';
import clsx from 'clsx';
import { getLevelForXp, localize } from '@student-journey/shared';
import type { Language, LevelSlug } from '@student-journey/shared';

interface LevelBadgeProps {
  xp: number;
  language?: Language;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelColors: Record<LevelSlug, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  applicant: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  future_student: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  documents_submitted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  accepted_student: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
};

const sizeStyles = {
  sm: { container: 'px-2 py-1 gap-1 text-xs', icon: 'text-sm' },
  md: { container: 'px-3 py-1.5 gap-1.5 text-sm', icon: 'text-base' },
  lg: { container: 'px-4 py-2 gap-2 text-base', icon: 'text-xl' },
};

export default function LevelBadge({
  xp,
  language = 'ru',
  size = 'md',
  className,
}: LevelBadgeProps) {
  const level = getLevelForXp(xp);
  const colors = levelColors[level.slug] || levelColors.beginner;
  const styles = sizeStyles[size];

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border font-medium',
        colors.bg,
        colors.text,
        colors.border,
        styles.container,
        className,
      )}
    >
      <span className={styles.icon} role="img" aria-label={localize(level.title, language)}>
        {level.icon}
      </span>
      <span>{localize(level.title, language)}</span>
    </div>
  );
}
