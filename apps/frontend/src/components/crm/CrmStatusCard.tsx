'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, XCircle, GraduationCap } from 'lucide-react';
import type { CrmApplicantStatus, Language } from '@student-journey/shared';
import api from '@/lib/api';
import Card from '@/components/ui/Card';

const STATUS_CONFIG: Record<
  string,
  { label: Record<Language, string>; color: string; Icon: React.ElementType }
> = {
  new: {
    label: { ru: 'Новая заявка', tk: 'Täze arza' },
    color: 'text-blue-600 bg-blue-50',
    Icon: ClipboardList,
  },
  in_review: {
    label: { ru: 'На рассмотрении', tk: 'Seretmek üçin' },
    color: 'text-yellow-600 bg-yellow-50',
    Icon: Clock,
  },
  approved: {
    label: { ru: 'Одобрена', tk: 'Tassyklandy' },
    color: 'text-green-600 bg-green-50',
    Icon: CheckCircle2,
  },
  rejected: {
    label: { ru: 'Отклонена', tk: 'Ret edildi' },
    color: 'text-red-600 bg-red-50',
    Icon: XCircle,
  },
  enrolled: {
    label: { ru: 'Зачислен', tk: 'Kabul edildi' },
    color: 'text-purple-600 bg-purple-50',
    Icon: GraduationCap,
  },
};

interface Props {
  language: Language;
}

export default function CrmStatusCard({ language }: Props) {
  const [status, setStatus] = useState<CrmApplicantStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: CrmApplicantStatus | null }>('/crm/status')
      .then((res) => setStatus(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!status) return null;

  const key = status.status?.toLowerCase() ?? 'new';
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG['new'];
  const StatusIcon = cfg.Icon;

  return (
    <Card padding="md" className="border-l-4 border-l-indigo-500">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {language === 'ru' ? 'Статус заявки в университете' : 'Uniwersitetdäki arza ýagdaýy'}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${cfg.color}`}>
          <StatusIcon className="h-4 w-4" />
          {cfg.label[language]}
        </span>
      </div>
      {(status.faculty_name || status.specialty_name) && (
        <p className="mt-2 text-xs text-gray-500">
          {status.faculty_name}
          {status.specialty_name ? ` · ${status.specialty_name}` : ''}
        </p>
      )}
      {status.is_converted && (
        <p className="mt-1 text-xs font-medium text-green-600">
          {language === 'ru' ? 'Вы зачислены как студент' : 'Siz talyplar hataryna giriň'}
        </p>
      )}
    </Card>
  );
}
