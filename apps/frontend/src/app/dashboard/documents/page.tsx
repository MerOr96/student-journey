'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  File,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { localize, QUESTS } from '@student-journey/shared';
import type { UserDocument, DocumentType, Language } from '@student-journey/shared';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AchievementPopup from '@/components/game/AchievementPopup';

const DOCUMENT_TYPES: { value: DocumentType; label: Record<Language, string> }[] = [
  { value: 'passport', label: { ru: 'Паспорт', tk: 'Pasport' } },
  { value: 'photo', label: { ru: 'Фото 3x4', tk: 'Surat 3x4' } },
  { value: 'diploma', label: { ru: 'Диплом / Аттестат', tk: 'Diplom / Attestat' } },
  { value: 'medical', label: { ru: 'Медицинская справка', tk: 'Lukmançylyk guwahaty' } },
  { value: 'other', label: { ru: 'Другое', tk: 'Beýleki' } },
];

const STATUS_CONFIG = {
  pending: {
    label: { ru: 'На проверке', tk: 'Barlagy dowam edýär' },
    color: 'bg-yellow-100 text-yellow-700',
    Icon: Clock,
  },
  approved: {
    label: { ru: 'Одобрено', tk: 'Tassyklandy' },
    color: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  rejected: {
    label: { ru: 'Отклонено', tk: 'Ret edildi' },
    color: 'bg-red-100 text-red-700',
    Icon: XCircle,
  },
};

export default function DocumentsPage() {
  const { language } = useAuth();
  const { profile, completeQuest } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('passport');
  const [dragOver, setDragOver] = useState(false);
  const [achievement, setAchievement] = useState<{
    type: 'quest' | 'badge' | 'level_up';
    title: string;
    description?: string;
    icon?: string;
  } | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.get<{ data: UserDocument[] }>('/documents');
      setDocuments(data.data);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', selectedType);

        const token = localStorage.getItem('auth_token');
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

        const response = await fetch(`${BASE_URL}/documents/upload`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        await fetchDocuments();

        // Auto-complete relevant quests
        if (profile) {
          if (
            selectedType === 'passport' &&
            !profile.completedQuests.includes('upload_passport')
          ) {
            await completeQuest('upload_passport');
            const quest = QUESTS.find((q) => q.slug === 'upload_passport');
            if (quest) {
              setAchievement({
                type: 'quest',
                title: localize(quest.title, language),
                description: `+${quest.xpReward} XP`,
                icon: '📋',
              });
            }
          }
          if (
            selectedType === 'photo' &&
            !profile.completedQuests.includes('upload_photo')
          ) {
            await completeQuest('upload_photo');
            const quest = QUESTS.find((q) => q.slug === 'upload_photo');
            if (quest) {
              setAchievement({
                type: 'quest',
                title: localize(quest.title, language),
                description: `+${quest.xpReward} XP`,
              });
            }
          }
        }
      } catch {
        // Handle error silently
      } finally {
        setUploading(false);
      }
    },
    [selectedType, fetchDocuments, profile, completeQuest, language],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'tk-TM', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText className="h-6 w-6 text-primary-600" />
          {language === 'ru' ? 'Документы' : 'Resminamalar'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {language === 'ru'
            ? 'Загружай документы для поступления'
            : 'Girmek ucin resminamalary yukle'}
        </p>
      </div>

      {/* Upload Section */}
      <Card padding="md">
        <div className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {language === 'ru' ? 'Тип документа' : 'Resminama gormüşi'}
            </label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => setSelectedType(dt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedType === dt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {localize(dt.label, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              dragOver
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }`}
          >
            <Upload
              className={`h-10 w-10 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`}
            />
            <p className="mt-3 text-sm font-medium text-gray-700">
              {language === 'ru'
                ? 'Перетащи файл сюда или нажми для выбора'
                : 'Faýly şu ýere süýräň ýa-da saýlamak üçin basyň'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, JPG, PNG (max 10MB)
            </p>
            {uploading && (
              <div className="mt-3 flex items-center gap-2">
                <span className="spinner h-4 w-4" />
                <span className="text-sm text-primary-600">
                  {language === 'ru' ? 'Загрузка...' : 'Ýüklenýär...'}
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </Card>

      {/* Documents List */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {language === 'ru' ? 'Загруженные документы' : 'Ýüklenen resminamalar'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="spinner h-6 w-6" />
          </div>
        ) : documents.length === 0 ? (
          <Card padding="md">
            <div className="flex flex-col items-center py-6 text-center">
              <File className="h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {language === 'ru'
                  ? 'Документы ещё не загружены'
                  : 'Resminamalar entek ýüklenmedik'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const typeInfo = DOCUMENT_TYPES.find((dt) => dt.value === doc.type);
              const statusInfo = STATUS_CONFIG[doc.status];
              const StatusIcon = statusInfo.Icon;

              return (
                <Card key={doc.id} padding="sm" className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {doc.fileName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {typeInfo ? localize(typeInfo.label, language) : doc.type}
                      </span>
                      <span>&middot;</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {localize(statusInfo.label, language)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Achievement Popup */}
      {achievement && (
        <AchievementPopup
          type={achievement.type}
          title={achievement.title}
          description={achievement.description}
          icon={achievement.icon}
          onClose={() => setAchievement(null)}
        />
      )}
    </div>
  );
}
