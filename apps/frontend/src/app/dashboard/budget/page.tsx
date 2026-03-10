'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { api } from '@/lib/api';
import type { Language, BudgetBreakdown } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calculator, Home, UtensilsCrossed, Shield } from 'lucide-react';

interface FacultyOption {
  id: string;
  slug: string;
  name: { ru: string; tk: string };
  tuitionPerYear: number;
}

export default function BudgetPage() {
  const { language } = useAuth();
  const { completeQuest } = useGame();
  const lang = (language || 'ru') as Language;

  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [facultySlug, setFacultySlug] = useState('');
  const [dormitory, setDormitory] = useState(true);
  const [mealPlan, setMealPlan] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [insurance, setInsurance] = useState(true);
  const [result, setResult] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  const t = {
    title: lang === 'tk' ? 'Býujet kalkulýatory' : 'Калькулятор бюджета',
    subtitle: lang === 'tk' ? 'Birinji ýyl üçin çykdajylary hasapla' : 'Рассчитай расходы на первый год обучения',
    faculty: lang === 'tk' ? 'Fakultet' : 'Факультет',
    selectFaculty: lang === 'tk' ? 'Fakulteti saýla' : 'Выберите факультет',
    dormitory: lang === 'tk' ? 'Ýatakhana' : 'Общежитие',
    mealPlan: lang === 'tk' ? 'Iýmitlenme meýilnamasy' : 'План питания',
    basic: lang === 'tk' ? 'Ýönekeý' : 'Базовый',
    standard: lang === 'tk' ? 'Standart' : 'Стандарт',
    premium: lang === 'tk' ? 'Premium' : 'Премиум',
    insuranceLabel: lang === 'tk' ? 'Saglyk ätiýaçlandyryşy' : 'Медицинская страховка',
    calculate: lang === 'tk' ? 'Hasapla' : 'Рассчитать',
    results: lang === 'tk' ? 'Netijeler' : 'Результаты',
    tuition: lang === 'tk' ? 'Okuw tölegi' : 'Обучение',
    dormCost: lang === 'tk' ? 'Ýatakhana' : 'Общежитие',
    meals: lang === 'tk' ? 'Iýmitlenme (10 aý)' : 'Питание (10 мес.)',
    insuranceCost: lang === 'tk' ? 'Ätiýaçlandyryş' : 'Страховка',
    monthly: lang === 'tk' ? 'Aýlyk ýaşaýyş (10 aý)' : 'Ежемесячные расходы (10 мес.)',
    total: lang === 'tk' ? 'Birinji ýyl jemi' : 'ИТОГО за первый год',
    rub: '₽',
  };

  useEffect(() => {
    api.get('/faculties').then((res: any) => {
      setFaculties(res.data);
      if (res.data.length > 0) setFacultySlug(res.data[0].slug);
    });
  }, []);

  const handleCalculate = async () => {
    if (!facultySlug) return;
    setLoading(true);
    try {
      const res: any = await api.post('/budget/calculate', {
        facultySlug,
        dormitory,
        mealPlan,
        insuranceIncluded: insurance,
      });
      setResult(res.data.breakdown);
      // quest is already completed by the backend endpoint
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const getName = (f: FacultyOption) => lang === 'tk' ? f.name.tk : f.name.ru;

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <div className="space-y-5">
            {/* Faculty select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.faculty}</label>
              <select
                value={facultySlug}
                onChange={(e) => setFacultySlug(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t.selectFaculty}</option>
                {faculties.map((f) => (
                  <option key={f.slug} value={f.slug}>{getName(f)}</option>
                ))}
              </select>
            </div>

            {/* Dormitory */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dormitory}
                onChange={(e) => setDormitory(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{t.dormitory}</span>
            </label>

            {/* Meal plan */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <UtensilsCrossed className="h-4 w-4 text-gray-400" />
                {t.mealPlan}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['basic', 'standard', 'premium'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setMealPlan(plan)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      mealPlan === plan
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t[plan]}
                  </button>
                ))}
              </div>
            </div>

            {/* Insurance */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{t.insuranceLabel}</span>
            </label>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleCalculate}
              loading={loading}
              disabled={!facultySlug}
            >
              <Calculator className="mr-2 h-4 w-4" />
              {t.calculate}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="bg-gradient-to-br from-white to-primary-50">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.results}</h2>
            <div className="space-y-3">
              {[
                { label: t.tuition, value: result.tuition },
                { label: t.dormCost, value: result.dormitory },
                { label: t.meals, value: result.meals },
                { label: t.insuranceCost, value: result.insurance },
                { label: t.monthly, value: result.estimatedMonthlyLiving * 10 },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {row.value > 0 ? `${fmt(row.value)} ${t.rub}` : '—'}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold text-gray-900">{t.total}</span>
                <span className="text-xl font-bold text-primary-600">
                  {fmt(result.totalFirstYear)} {t.rub}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
