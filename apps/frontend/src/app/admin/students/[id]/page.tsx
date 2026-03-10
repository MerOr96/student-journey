'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LEVELS, BADGES, QUESTS } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, Mail, Phone, Star, FileText, Calendar,
  CheckCircle, XCircle, Clock, Shield
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Новая', color: 'bg-gray-100 text-gray-700' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { value: 'DOCUMENTS_REVIEW', label: 'Проверка документов', color: 'bg-amber-100 text-amber-700' },
  { value: 'ACCEPTED', label: 'Принят', color: 'bg-green-100 text-green-700' },
  { value: 'REJECTED', label: 'Отказано', color: 'bg-red-100 text-red-700' },
];

const DOC_STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4 text-amber-500" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      api.get(`/admin/students/${params.id}`).then((res: any) => {
        setStudent(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [params.id]);

  const updateStatus = async (status: string) => {
    setStatusUpdating(true);
    try {
      await api.put(`/admin/students/${params.id}/status`, { status });
      setStudent((prev: any) => ({
        ...prev,
        application: { ...prev.application, status },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner h-8 w-8" /></div>;
  }

  if (!student) {
    return <div className="text-center py-20 text-gray-400">Студент не найден</div>;
  }

  const level = LEVELS.find((l) => l.slug === student.profile?.level);
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === student.application?.status);

  return (
    <div className="page-transition space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/admin/students')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к списку
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
            {student.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {student.email}</span>
              {student.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {student.phone}</span>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              Регистрация: {new Date(student.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>

        {/* Current status badge */}
        {currentStatus && (
          <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gamification profile */}
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Star className="h-5 w-5 text-primary-600" />
            Профиль геймификации
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <p className="text-2xl font-bold text-primary-700">{student.profile?.xp || 0}</p>
              <p className="text-xs text-primary-600">XP</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <p className="text-2xl">{level?.icon || '🌱'}</p>
              <p className="text-xs text-purple-600">{level?.title.ru || 'Новичок'}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{student.badges?.length || 0}</p>
              <p className="text-xs text-amber-600">Бейджи</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{student.questCompletions?.length || 0}</p>
              <p className="text-xs text-green-600">Квесты</p>
            </div>
          </div>

          {/* Badges earned */}
          {student.badges && student.badges.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Полученные бейджи:</p>
              <div className="flex flex-wrap gap-2">
                {student.badges.map((b: any) => {
                  const badge = BADGES.find((bb) => bb.slug === b.badgeSlug);
                  return (
                    <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                      {badge?.icon} {badge?.title.ru || b.badgeSlug}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quests completed */}
          {student.questCompletions && student.questCompletions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Завершённые квесты:</p>
              <div className="space-y-1">
                {student.questCompletions.map((qc: any) => {
                  const quest = QUESTS.find((q) => q.slug === qc.questSlug);
                  return (
                    <div key={qc.id} className="flex items-center justify-between rounded-md bg-green-50 px-3 py-1.5 text-sm">
                      <span className="text-green-800">{quest?.title.ru || qc.questSlug}</span>
                      <span className="text-green-600 font-medium">+{qc.xpAwarded} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Documents & Application */}
        <div className="space-y-6">
          {/* Application status change */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Shield className="h-5 w-5 text-primary-600" />
              Статус заявки
            </h2>
            {student.application?.faculty && (
              <p className="mb-3 text-sm text-gray-600">
                Факультет: <strong>{student.application.faculty.nameRu}</strong>
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  disabled={statusUpdating || student.application?.status === opt.value}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    student.application?.status === opt.value
                      ? `${opt.color} border-transparent ring-2 ring-primary-300`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5 text-primary-600" />
              Документы
            </h2>
            {student.documents && student.documents.length > 0 ? (
              <div className="space-y-2">
                {student.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {DOC_STATUS_ICON[doc.status] || <Clock className="h-4 w-4 text-gray-400" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">{doc.type} · {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {doc.status === 'PENDING' && (
                        <>
                          <button
                            onClick={async () => {
                              await api.put(`/documents/${doc.id}/review`, { status: 'APPROVED' });
                              // Refresh
                              const res: any = await api.get(`/admin/students/${params.id}`);
                              setStudent(res.data);
                            }}
                            className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={async () => {
                              await api.put(`/documents/${doc.id}/review`, { status: 'REJECTED', reviewNote: 'Требуется замена' });
                              const res: any = await api.get(`/admin/students/${params.id}`);
                              setStudent(res.data);
                            }}
                            className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 transition-colors"
                          >
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Документы не загружены</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
