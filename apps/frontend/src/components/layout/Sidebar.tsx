'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  FileText,
  Building2,
  Calculator,
  MessageCircle,
  Medal,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import {
  getLevelForXp,
  getNextLevel,
  getXpProgressPercent,
  localize,
  QUESTS,
} from '@student-journey/shared';
import type { Language } from '@student-journey/shared';

interface SidebarLink {
  href: string;
  label: Record<Language, string>;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const sidebarLinks: SidebarLink[] = [
  {
    href: '/dashboard',
    label: { ru: 'Обзор', tk: 'Syn' },
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/quests',
    label: { ru: 'Квесты', tk: 'Kwestler' },
    icon: Trophy,
  },
  {
    href: '/dashboard/documents',
    label: { ru: 'Документы', tk: 'Resminamalar' },
    icon: FileText,
  },
  {
    href: '/dashboard/faculties',
    label: { ru: 'Факультеты', tk: 'Fakultetler' },
    icon: Building2,
  },
  {
    href: '/dashboard/chat',
    label: { ru: 'Чат', tk: 'Söhbet' },
    icon: MessageCircle,
  },
  {
    href: '/dashboard/leaderboard',
    label: { ru: 'Рейтинг', tk: 'Reýting' },
    icon: Medal,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, language, isAdmin } = useAuth();
  const { profile } = useGame();

  if (!user) return null;

  const level = profile ? getLevelForXp(profile.xp) : null;
  const nextLevel = level ? getNextLevel(level.slug) : null;
  const xpPercent = profile ? getXpProgressPercent(profile.xp) : 0;
  const completedCount = profile?.completedQuests.length ?? 0;
  const totalQuests = QUESTS.length;

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* User Info */}
      <div className="border-b border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900">
              {user.fullName}
            </div>
            {level && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <span>{level.icon}</span>
                <span>{localize(level.title, language)}</span>
              </div>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        {profile && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">
                {profile.xp} XP
              </span>
              {nextLevel ? (
                <span className="text-gray-500">
                  {localize(nextLevel.title, language)} ({nextLevel.minXp} XP)
                </span>
              ) : (
                <span className="text-accent-600 font-medium">MAX</span>
              )}
            </div>
            <div className="xp-bar">
              <div
                className="xp-bar-fill"
                style={{ '--xp-percent': `${xpPercent}%`, width: `${xpPercent}%` } as React.CSSProperties}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <ul className="space-y-0.5">
          {sidebarLinks.filter((link) => !link.adminOnly || isAdmin).map((link) => {
            const Icon = link.icon;
            const active =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-5 w-5 flex-shrink-0',
                      active ? 'text-primary-600' : 'text-gray-400',
                    )}
                  />
                  {localize(link.label, language)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quest Completion Count */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2.5">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent-600" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-accent-800">
              {language === 'ru' ? 'Квесты выполнены' : 'Kwestler ýerine ýetirildi'}
            </div>
            <div className="text-sm font-bold text-accent-700">
              {completedCount} / {totalQuests}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
