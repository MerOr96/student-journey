'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LEVELS, BADGES, QUESTS } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, Mail, Phone, Star, FileText, Calendar,
  CheckCircle, XCircle, Clock, Shield, Send, Trash2, RotateCcw, GraduationCap, BookOpen,
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
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [promoting, setPromoting] = useState(false);

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
      setStudent((prev: any) => ({ ...prev, applicationStatus: status }));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  const promoteToStudent = async () => {
    if (!confirm(`Перевести «${student.fullName}» в статус студента? Приложение переключится на студенческий интерфейс.`)) return;
    setPromoting(true);
    try {
      await api.put(`/admin/students/${params.id}/role`, { appRole: 'STUDENT' });
      setStudent((prev: any) => ({ ...prev, appRole: 'student' }));
    } catch (e) {
      alert('Не удалось перевести в студенты');
    } finally {
      setPromoting(false);
    }
  };

  const resetProgress = async () => {
    if (!confirm(`Сбросить весь игровой прогресс «${student.fullName}»? Квесты, бейджи и XP обнулятся.`)) return;
    setResettingProgress(true);
    try {
      await api.delete(`/admin/students/${params.id}/progress`);
      const res: any = await api.get(`/admin/students/${params.id}`);
      setStudent(res.data);
    } catch (e) {
      alert('Не удалось сбросить прогресс');
    } finally {
      setResettingProgress(false);
    }
  };

  const deleteStudent = async () => {
    if (!confirm(`Удалить абитуриента «${student.fullName}»? Данные сохранятся в базе, но будут скрыты.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/students/${params.id}`);
      router.push('/admin/students');
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить абитуриента');
    } finally {
      setDeleting(false);
    }
  };

  const transferToCRM = async () => {
    if (!confirm('Передать абитуриента в Django CRM? После этого он появится в системе университета.')) return;
    setTransferring(true);
    setTransferMsg('');
    try {
      const res: any = await api.post(`/admin/students/${params.id}/transfer`, {});
      if (res.success) {
        if (res.data?.alreadyTransferred) {
          setTransferMsg(`Уже передан (CRM ID: ${res.data.crmApplicantId})`);
        } else {
          setTransferMsg(`Передан успешно (CRM ID: ${res.data.crmApplicantId})`);
          setStudent((prev: any) => ({
            ...prev,
            crmApplicantId: res.data.crmApplicantId,
            applicationStatus: 'ACCEPTED',
          }));
        }
      } else {
        setTransferMsg(`Ошибка: ${res.message}`);
      }
    } catch (e: any) {
      setTransferMsg('Не удалось передать в CRM');
    } finally {
      setTransferring(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Точно удалить этот документ?')) return;
    try {
      const res: any = await api.delete(`/documents/${docId}`);
      if (res.success) {
        setStudent((prev: any) => ({
          ...prev,
          documents: prev.documents.filter((d: any) => d.id !== docId),
        }));
      } else {
        alert('Не удалось удалить документ');
      }
    } catch (e) {
      alert('Ошибка при удалении');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner h-8 w-8" /></div>;
  }

  if (!student) {
    return <div className="text-center py-20 text-gray-400">Студент не найден</div>;
  }

  const level = LEVELS.find((l) => l.slug === student.profile?.level);
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === (student.applicationStatus || 'NEW'));

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
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Регистрация: {new Date(student.createdAt).toLocaleDateString('ru-RU')}</span>
              {student.crmApplicantId && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  CRM #{student.crmApplicantId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current status badge + delete */}
        <div className="flex items-center gap-3">
          {currentStatus && (
            <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
          <button
            onClick={deleteStudent}
            disabled={deleting}
            title="Удалить абитуриента"
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gamification profile */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Star className="h-5 w-5 text-primary-600" />
              Профиль геймификации
            </h2>
            <button
              onClick={resetProgress}
              disabled={resettingProgress}
              title="Сбросить прогресс"
              className="flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {resettingProgress ? 'Сброс...' : 'Сбросить прогресс'}
            </button>
          </div>
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
              <p className="text-2xl font-bold text-amber-700">{student.earnedBadges?.length || 0}</p>
              <p className="text-xs text-amber-600">Бейджи</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{student.questCompletions?.length || 0}</p>
              <p className="text-xs text-green-600">Квесты</p>
            </div>
          </div>

          {/* Badges earned */}
          {student.earnedBadges && student.earnedBadges.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Полученные бейджи:</p>
              <div className="flex flex-wrap gap-2">
                {student.earnedBadges.map((b: any) => {
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
          {/* Faculty choice */}
          {(student.chosenFacultyName || student.chosenFacultyId) && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <BookOpen className="h-5 w-5 text-primary-600" />
                Выбранный факультет
              </h2>
              <div className="rounded-lg bg-blue-50 px-4 py-3">
                <p className="font-medium text-blue-900">
                  {student.chosenFacultyName || `Факультет #${student.chosenFacultyId}`}
                </p>
                {student.chosenSpecialtyName && (
                  <p className="mt-1 text-sm text-blue-700">{student.chosenSpecialtyName}</p>
                )}
              </div>
            </Card>
          )}

          {/* Application status change */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Shield className="h-5 w-5 text-primary-600" />
              Статус заявки
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  disabled={statusUpdating || student.applicationStatus === opt.value}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    student.applicationStatus === opt.value
                      ? `${opt.color} border-transparent ring-2 ring-primary-300`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Transfer to Django CRM */}
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs text-gray-500">
                После передачи абитуриент появится в Django CRM университета.
              </p>
              <Button
                variant={student.crmApplicantId ? 'secondary' : 'primary'}
                size="sm"
                onClick={transferToCRM}
                disabled={transferring}
                className="flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {student.crmApplicantId ? `Уже в CRM (#${student.crmApplicantId})` : 'Передать в Django CRM'}
              </Button>
              {transferMsg && (
                <p className={`mt-2 text-xs ${transferMsg.startsWith('Ошибка') || transferMsg.startsWith('Не удалось') ? 'text-red-600' : 'text-green-600'}`}>
                  {transferMsg}
                </p>
              )}
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
                      {DOC_STATUS_ICON[doc.status?.toUpperCase()] || <Clock className="h-4 w-4 text-gray-400" />}
                      <div>
                        <a 
                          href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '')}${doc.fileUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <p className="text-xs text-gray-400">{doc.type} · {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      {doc.status === 'pending' && (
                        <>
                          <button
                            onClick={async () => {
                              await api.put(`/documents/${doc.id}/review`, { status: 'APPROVED' });
                              const res: any = await api.get(`/admin/students/${params.id}`);
                              setStudent(res.data);
                            }}
                            className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 transition-colors"
                            title="Одобрить"
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
                            title="Отклонить"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-red-100 hover:text-red-700 transition-colors ml-1"
                        title="Удалить документ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
