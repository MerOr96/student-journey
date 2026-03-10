'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Language } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { MapPin, Building2, Home, UtensilsCrossed, Dumbbell, BookOpen, Landmark } from 'lucide-react';

interface Location {
  id: string;
  name: { ru: string; tk: string };
  description: { ru: string; tk: string };
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; label: Record<string, string> }> = {
  ACADEMIC: { icon: Building2, color: 'bg-blue-100 text-blue-600', label: { ru: 'Учебное', tk: 'Okuw' } },
  DORMITORY: { icon: Home, color: 'bg-purple-100 text-purple-600', label: { ru: 'Общежитие', tk: 'Ýatakhana' } },
  DINING: { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600', label: { ru: 'Столовая', tk: 'Naharhanaa' } },
  SPORT: { icon: Dumbbell, color: 'bg-green-100 text-green-600', label: { ru: 'Спорт', tk: 'Sport' } },
  LIBRARY: { icon: BookOpen, color: 'bg-amber-100 text-amber-600', label: { ru: 'Библиотека', tk: 'Kitaphana' } },
  ADMIN: { icon: Landmark, color: 'bg-red-100 text-red-600', label: { ru: 'Администрация', tk: 'Dolandyryş' } },
};

// Relative positions for the visual map (percent-based)
const MAP_POSITIONS: Record<string, { left: string; top: string }> = {
  ACADEMIC: { left: '30%', top: '25%' },
  LIBRARY: { left: '60%', top: '20%' },
  DORMITORY: { left: '75%', top: '55%' },
  DINING: { left: '45%', top: '50%' },
  SPORT: { left: '20%', top: '65%' },
  ADMIN: { left: '50%', top: '75%' },
};

export default function CampusPage() {
  const { language } = useAuth();
  const lang = (language || 'ru') as Language;

  const [locations, setLocations] = useState<Location[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    title: lang === 'tk' ? 'Kampus kartasy' : 'Карта кампуса',
    subtitle: lang === 'tk' ? 'UlGU-nyň esasy ýerlerini öwren' : 'Изучи основные места УлГУ',
    all: lang === 'tk' ? 'Hemmesi' : 'Все',
  };

  useEffect(() => {
    api.get('/campus').then((res: any) => {
      setLocations(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getName = (l: Location) => lang === 'tk' ? l.name.tk : l.name.ru;
  const getDesc = (l: Location) => lang === 'tk' ? l.description.tk : l.description.ru;

  const normCat = (c: string) => c.toUpperCase();
  const filtered = filter === 'ALL' ? locations : locations.filter((l) => normCat(l.category) === filter);
  const categories = ['ALL', ...Object.keys(CATEGORY_META)];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner h-8 w-8" /></div>;
  }

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => { setFilter(cat); setSelected(null); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {meta ? <meta.icon className="h-3.5 w-3.5" /> : null}
              {cat === 'ALL' ? t.all : (meta?.label[lang] || cat)}
            </button>
          );
        })}
      </div>

      {/* Visual Map */}
      <Card className="relative overflow-hidden" padding="none">
        <div className="relative h-96 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          {/* Map grid lines for visual effect */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-gray-400" style={{ top: `${(i + 1) * 11}%` }} />
            ))}
            {[...Array(8)].map((_, i) => (
              <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-gray-400" style={{ left: `${(i + 1) * 11}%` }} />
            ))}
          </div>

          {/* Road paths */}
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100,100 Q 200,200 350,180 T 500,300" stroke="#d1d5db" strokeWidth="3" fill="none" strokeDasharray="8,4" />
            <path d="M 200,50 L 200,350" stroke="#d1d5db" strokeWidth="2" fill="none" strokeDasharray="6,3" />
            <path d="M 50,200 L 550,200" stroke="#d1d5db" strokeWidth="2" fill="none" strokeDasharray="6,3" />
          </svg>

          {/* Location markers */}
          {filtered.map((loc, idx) => {
            const cat = normCat(loc.category);
            const pos = MAP_POSITIONS[cat] || { left: `${20 + idx * 15}%`, top: '40%' };
            const meta = CATEGORY_META[cat];
            const Icon = meta?.icon || MapPin;
            const isSelected = selected?.id === loc.id;

            return (
              <button
                key={loc.id}
                onClick={() => setSelected(loc)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                  isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                }`}
                style={{ left: pos.left, top: pos.top }}
              >
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md border-2 ${
                    isSelected ? 'border-primary-500 ring-4 ring-primary-200' : 'border-white'
                  } ${meta?.color || 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium shadow-sm ${
                    isSelected ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
                  }`}>
                    {getName(loc)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected detail or location list */}
      {selected ? (
        <Card hover className="border-primary-200 bg-primary-50/30">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              CATEGORY_META[normCat(selected.category)]?.color || 'bg-gray-100 text-gray-600'
            }`}>
              {(() => { const Icon = CATEGORY_META[normCat(selected.category)]?.icon || MapPin; return <Icon className="h-6 w-6" />; })()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getName(selected)}</h3>
              <p className="mt-1 text-sm text-gray-600">{getDesc(selected)}</p>
              <p className="mt-2 text-xs text-gray-400">
                📍 {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((loc) => {
            const meta = CATEGORY_META[normCat(loc.category)];
            const Icon = meta?.icon || MapPin;
            return (
              <Card key={loc.id} hover className="cursor-pointer" onClick={() => setSelected(loc)}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta?.color || 'bg-gray-100'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{getName(loc)}</h4>
                    <p className="text-xs text-gray-500">{meta?.label[lang] || loc.category}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
