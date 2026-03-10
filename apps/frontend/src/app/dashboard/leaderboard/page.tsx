'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { LEVELS } from '@student-journey/shared';
import type { Language, LeaderboardEntry } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Trophy, Medal, Award, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, language, isAdmin } = useAuth();
  const lang = (language || 'ru') as Language;

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    title: lang === 'tk' ? 'Liderler tagtasy' : 'Таблица лидеров',
    subtitle: lang === 'tk' ? 'Iň aktiw dalaşgärler' : 'Самые активные абитуриенты',
    rank: lang === 'tk' ? '#' : '№',
    name: lang === 'tk' ? 'At' : 'Имя',
    xp: 'XP',
    level: lang === 'tk' ? 'Dereje' : 'Уровень',
    badges: lang === 'tk' ? 'Nyşanlar' : 'Бейджи',
    you: lang === 'tk' ? '(sen)' : '(вы)',
    empty: lang === 'tk' ? 'Entek hiç kim ýok' : 'Пока никого нет',
  };

  useEffect(() => {
    api.get('/leaderboard').then((res: any) => {
      setEntries(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-gray-500">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-100';
  };

  const getLevelTitle = (slug: string) => {
    const level = LEVELS.find((l) => l.slug === slug);
    return level ? level.title[lang] : slug;
  };

  const getLevelIcon = (slug: string) => {
    const level = LEVELS.find((l) => l.slug === slug);
    return level?.icon || '🌱';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner h-8 w-8" /></div>;
  }

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((entry, idx) => {
            const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const height = rank === 1 ? 'h-32' : rank === 2 ? 'h-24' : 'h-20';
            return (
              <div key={entry.userId} className="flex flex-col items-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold ${
                  rank === 1 ? 'border-yellow-400 bg-yellow-100' :
                  rank === 2 ? 'border-gray-300 bg-gray-100' :
                  'border-amber-400 bg-amber-100'
                }`}>
                  {entry.avatarUrl
                    ? <img src={entry.avatarUrl} className="h-full w-full rounded-full object-cover" alt="" />
                    : entry.fullName.charAt(0).toUpperCase()
                  }
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900 truncate max-w-full">
                  {entry.fullName}
                  {entry.userId === user?.id && <span className="ml-1 text-primary-500">{t.you}</span>}
                </p>
                <p className="text-xs text-gray-500">{entry.xp} XP</p>
                <div className={`mt-2 w-full rounded-t-lg ${
                  rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : 'bg-amber-400'
                } ${height} flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <Card padding="none">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <div className="col-span-1">{t.rank}</div>
          <div className="col-span-4">{t.name}</div>
          <div className="col-span-2 text-right">{t.xp}</div>
          <div className="col-span-3">{t.level}</div>
          <div className="col-span-2 text-center">{t.badges}</div>
        </div>

        {/* Rows */}
        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400">{t.empty}</div>
        ) : (
          entries.map((entry) => {
            const isCurrentUser = entry.userId === user?.id;
            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-12 items-center gap-2 border-b px-4 py-3 transition-colors ${
                  getRankBg(entry.rank)
                } ${isCurrentUser ? 'ring-1 ring-inset ring-primary-300' : ''}`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                    {entry.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm truncate ${isCurrentUser ? 'font-bold text-primary-700' : 'text-gray-800'}`}>
                    {entry.fullName}
                    {isCurrentUser && <span className="ml-1 text-xs text-primary-500">{t.you}</span>}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                    <Star className="h-3 w-3" />
                    {entry.xp}
                  </span>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-sm text-gray-600">
                  <span>{getLevelIcon(entry.level)}</span>
                  <span className="truncate">{getLevelTitle(entry.level)}</span>
                </div>
                <div className="col-span-2 text-center text-sm text-gray-600">
                  {entry.badgeCount} 🏅
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
