'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Users, UserPlus, FileCheck, CheckCircle, Star, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  newThisWeek: number;
  documentsSubmitted: number;
  accepted: number;
  averageXp: number;
  topReferrers: Array<{ fullName: string; referralCount: number; xp: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((res: any) => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner h-8 w-8" /></div>;
  }

  const statCards = [
    { label: 'Всего студентов', value: stats?.totalStudents || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Новые за неделю', value: stats?.newThisWeek || 0, icon: UserPlus, color: 'bg-green-100 text-green-600' },
    { label: 'Документы поданы', value: stats?.documentsSubmitted || 0, icon: FileCheck, color: 'bg-amber-100 text-amber-600' },
    { label: 'Приняты', value: stats?.accepted || 0, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Средний XP', value: Math.round(stats?.averageXp || 0), icon: Star, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="mt-1 text-gray-500">Обзор активности студентов и заявок</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} hover>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top referrers */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Топ рефереры</h2>
        </div>
        {stats?.topReferrers && stats.topReferrers.length > 0 ? (
          <div className="space-y-3">
            {stats.topReferrers.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-800">{r.fullName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{r.referralCount} приглашений</span>
                  <span className="text-primary-600 font-medium">{r.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Пока нет рефералов</p>
        )}
      </Card>
    </div>
  );
}
