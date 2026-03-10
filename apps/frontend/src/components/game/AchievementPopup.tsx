'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { X, Trophy, Star, ArrowUpCircle } from 'lucide-react';

type AchievementType = 'quest' | 'badge' | 'level_up';

interface AchievementPopupProps {
  type: AchievementType;
  title: string;
  description?: string;
  icon?: string;
  onClose: () => void;
}

const typeConfig: Record<
  AchievementType,
  { bg: string; border: string; text: string; FallbackIcon: React.ElementType }
> = {
  quest: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    FallbackIcon: Trophy,
  },
  badge: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    FallbackIcon: Star,
  },
  level_up: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    FallbackIcon: ArrowUpCircle,
  },
};

export default function AchievementPopup({
  type,
  title,
  description,
  icon,
  onClose,
}: AchievementPopupProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = typeConfig[type];

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Auto-dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={clsx(
        'fixed right-4 top-4 z-50 w-80 overflow-hidden rounded-xl border shadow-xl transition-all duration-300',
        config.bg,
        config.border,
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              config.bg,
            )}
          >
            {icon ? (
              <span className="text-xl" role="img" aria-label={title}>
                {icon}
              </span>
            ) : (
              <config.FallbackIcon className={clsx('h-5 w-5', config.text)} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={clsx('text-xs font-medium uppercase tracking-wide', config.text)}>
              {type === 'quest' && 'Quest Complete!'}
              {type === 'badge' && 'Badge Earned!'}
              {type === 'level_up' && 'Level Up!'}
            </p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{title}</p>
            {description && (
              <p className="mt-0.5 text-xs text-gray-600">{description}</p>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Animated progress bar that shrinks over 3 seconds */}
      <div className="h-1 w-full bg-white/50">
        <div
          className={clsx(
            'h-full rounded-full transition-all ease-linear',
            type === 'quest' && 'bg-blue-400',
            type === 'badge' && 'bg-amber-400',
            type === 'level_up' && 'bg-purple-400',
          )}
          style={{
            width: visible && !exiting ? '0%' : '100%',
            transitionDuration: '3000ms',
          }}
        />
      </div>
    </div>
  );
}
