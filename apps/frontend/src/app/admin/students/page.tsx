'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LEVELS } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, ChevronLeft, ChevronRight, Eye, FileText, Star } from 'lucide-react';
import Link from 'next/link';

interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
  profile?: { xp: number; level: string };
  _count?: { badges: number; questCompletions: number };
  application?: { status: string; faculty?: { nameRu: string } };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  DOCUMENTS_REVIEW: { label: 'Проверка', color: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { label: 'Принят', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Отказ', color: 'bg-red-100 text-red-700' },
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      const res: any = await api.get(`/admin/students?${params}`);
      setStudents(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchStudents();
  };

  const totalPages = Math.ceil(total / pageSize);

  const getLevelIcon = (slug: string) => {
    return LEVELS.find((l) => l.slug === slug)?.icon || '🌱';
  };

  return (
    <div className="page-transition space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Студенты</h1>
          <p className="mt-1 text-gray-500">{total} студентов всего</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Поиск по имени или email..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <Button variant="primary" size="md" onClick={handleSearch}>Найти</Button>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Студент</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">XP / Уровень</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Факультет</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Квесты</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center"><div className="spinner mx-auto h-6 w-6" /></td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Студенты не найдены</td>
                </tr>
              ) : (
                students.map((s) => {
                  const status = STATUS_LABELS[s.application?.status || 'NEW'];
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{s.fullName}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{getLevelIcon(s.profile?.level || 'beginner')}</span>
                          <span className="text-sm font-medium text-gray-700">{s.profile?.xp || 0}</span>
                          <Star className="h-3 w-3 text-primary-500" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {s.application?.faculty?.nameRu || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FileText className="h-3.5 w-3.5" />
                          {s._count?.questCompletions || 0} / 9
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Стр. {page} из {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
