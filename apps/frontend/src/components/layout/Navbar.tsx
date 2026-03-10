'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  Trophy,
  Building2,
  Map,
  MessageCircle,
  Shield,
  Globe,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { getLevelForXp, localize } from '@student-journey/shared';
import type { Language } from '@student-journey/shared';

interface NavLink {
  href: string;
  label: Record<Language, string>;
  icon: React.ElementType;
}

const navLinks: NavLink[] = [
  {
    href: '/dashboard',
    label: { ru: 'Дашборд', tk: 'Esasy sahypa' },
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/quests',
    label: { ru: 'Квесты', tk: 'Kwestler' },
    icon: Trophy,
  },
  {
    href: '/dashboard/faculties',
    label: { ru: 'Факультеты', tk: 'Fakultetler' },
    icon: Building2,
  },
  {
    href: '/dashboard/campus',
    label: { ru: 'Кампус', tk: 'Kampus' },
    icon: Map,
  },
  {
    href: '/dashboard/chat',
    label: { ru: 'Чат', tk: 'Söhbet' },
    icon: MessageCircle,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, language, setLanguage, logout } = useAuth();
  const { profile } = useGame();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const level = profile ? getLevelForXp(profile.xp) : null;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary-600" />
              <span className="hidden text-lg font-bold text-gray-900 sm:block">
                OkuwHemrasy
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {localize(link.label, language)}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={clsx(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-red-50 text-red-700'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700',
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right: Lang toggle + User menu */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
              <button
                onClick={() => setLanguage('ru')}
                className={clsx(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  language === 'ru'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Globe className="h-3 w-3" />
                RU
              </button>
              <button
                onClick={() => setLanguage('tk')}
                className={clsx(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  language === 'tk'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Globe className="h-3 w-3" />
                TK
              </button>
            </div>

            {/* User Menu (Desktop) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left lg:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.fullName}
                  </div>
                  {level && (
                    <div className="text-xs text-gray-500">
                      {level.icon} {localize(level.title, language)}
                    </div>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {language === 'ru' ? 'Выйти' : 'Cykys'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {localize(link.label, language)}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {user.fullName}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {language === 'ru' ? 'Выйти' : 'Cykys'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
