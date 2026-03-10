'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { api } from '@/lib/api';
import { localize } from '@student-journey/shared';
import type { Language } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Clock, DollarSign, Check } from 'lucide-react';

interface FacultyData {
  id: string;
  slug: string;
  name: { ru: string; tk: string };
  description: { ru: string; tk: string };
  tuitionPerYear: number;
  durationYears: number;
  imageUrl?: string;
}

export default function FacultiesPage() {
  const { language } = useAuth();
  const { completeQuest } = useGame();
  const [faculties, setFaculties] = useState<FacultyData[]>([]);
  const [chosenSlug, setChosenSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState<string | null>(null);

  const lang = (language || 'ru') as Language;

  useEffect(() => {
    api.get('/faculties').then((res: any) => {
      setFaculties(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChoose = async (slug: string) => {
    setChoosing(slug);
    try {
      await api.post('/faculties/choose', { facultySlug: slug });
      setChosenSlug(slug);
      await completeQuest('choose_faculty');
    } catch (e) {
      console.error(e);
    } finally {
      setChoosing(null);
    }
  };

  const getName = (f: FacultyData) => lang === 'tk' ? f.name.tk : f.name.ru;
  const getDesc = (f: FacultyData) => lang === 'tk' ? f.description.tk : f.description.ru;

  const t = {
    title: lang === 'tk' ? 'Fakultetler' : 'Факультеты',
    subtitle: lang === 'tk' ? 'Hünäriňi saýla we geljegini gur' : 'Выбери свою специальность и построй будущее',
    tuition: lang === 'tk' ? 'Okuw tölegi' : 'Стоимость обучения',
    duration: lang === 'tk' ? 'Okuw möhleti' : 'Срок обучения',
    years: lang === 'tk' ? 'ýyl' : 'лет',
    perYear: lang === 'tk' ? '/ ýylda' : '/ год',
    choose: lang === 'tk' ? 'Saýla' : 'Выбрать',
    chosen: lang === 'tk' ? 'Saýlanan' : 'Выбран',
    rub: '₽',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {faculties.map((f) => {
          const isChosen = chosenSlug === f.slug;
          return (
            <Card
              key={f.id}
              hover
              className={`relative overflow-hidden ${isChosen ? 'ring-2 ring-accent-500' : ''}`}
            >
              {isChosen && (
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <GraduationCap className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">{getName(f)}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-3">{getDesc(f)}</p>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {f.tuitionPerYear.toLocaleString('ru-RU')} {t.rub} {t.perYear}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {f.durationYears} {t.years}
                </span>
              </div>

              <Button
                variant={isChosen ? 'secondary' : 'primary'}
                size="sm"
                className="mt-4 w-full"
                disabled={isChosen || choosing !== null}
                loading={choosing === f.slug}
                onClick={() => handleChoose(f.slug)}
              >
                {isChosen ? t.chosen : t.choose}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
