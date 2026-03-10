'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { localize, QUESTS } from '@student-journey/shared';
import type { Language } from '@student-journey/shared';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AchievementPopup from '@/components/game/AchievementPopup';

// ─── Quiz Data ─────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  text: Record<Language, string>;
  options: {
    id: string;
    text: Record<Language, string>;
    facultySlugs: string[];
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: {
      ru: 'Какой предмет в школе тебе нравится больше всего?',
      tk: 'Mekdepde haýsy dersi has gowy gorýarsiň?',
    },
    options: [
      {
        id: 'q1a',
        text: { ru: 'Математика и физика', tk: 'Matematika we fizika' },
        facultySlugs: ['engineering', 'computer_science', 'physics'],
      },
      {
        id: 'q1b',
        text: { ru: 'Биология и химия', tk: 'Biologiýa we himiýa' },
        facultySlugs: ['medicine', 'pharmacy', 'biology'],
      },
      {
        id: 'q1c',
        text: { ru: 'Языки и литература', tk: 'Diller we edebiýat' },
        facultySlugs: ['linguistics', 'journalism', 'philology'],
      },
      {
        id: 'q1d',
        text: { ru: 'Экономика и обществознание', tk: 'Ykdysadyyet we jemgyýet' },
        facultySlugs: ['economics', 'law', 'management'],
      },
    ],
  },
  {
    id: 'q2',
    text: {
      ru: 'Чем ты любишь заниматься в свободное время?',
      tk: 'Boş wagtyňda näme etmegi halaýarsyň?',
    },
    options: [
      {
        id: 'q2a',
        text: { ru: 'Программировать или делать проекты', tk: 'Programmirlemek ýa-da taslamalary etmek' },
        facultySlugs: ['computer_science', 'engineering', 'it'],
      },
      {
        id: 'q2b',
        text: { ru: 'Рисовать, фотографировать, дизайнить', tk: 'Surat çekmek, surata almak, dizaýn' },
        facultySlugs: ['design', 'architecture', 'arts'],
      },
      {
        id: 'q2c',
        text: { ru: 'Читать, писать, общаться', tk: 'Okamak, ýazmak, söhbet etmek' },
        facultySlugs: ['journalism', 'philology', 'linguistics'],
      },
      {
        id: 'q2d',
        text: { ru: 'Заниматься спортом или путешествовать', tk: 'Sport bilen meşgullanmak ýa-da syýahat etmek' },
        facultySlugs: ['tourism', 'sports', 'geography'],
      },
    ],
  },
  {
    id: 'q3',
    text: {
      ru: 'Какая работа тебя привлекает?',
      tk: 'Haýsy iş seni gyzyklandyrýar?',
    },
    options: [
      {
        id: 'q3a',
        text: { ru: 'Врач или фармацевт', tk: 'Lukman ýa-da dermanhanacy' },
        facultySlugs: ['medicine', 'pharmacy', 'biology'],
      },
      {
        id: 'q3b',
        text: { ru: 'Программист или аналитик данных', tk: 'Programmist ýa-da maglumat analitigi' },
        facultySlugs: ['computer_science', 'it', 'engineering'],
      },
      {
        id: 'q3c',
        text: { ru: 'Менеджер или предприниматель', tk: 'Menejer ýa-da telekeçi' },
        facultySlugs: ['management', 'economics', 'marketing'],
      },
      {
        id: 'q3d',
        text: { ru: 'Юрист или дипломат', tk: 'Hukukçy ýa-da diplomat' },
        facultySlugs: ['law', 'international_relations', 'political_science'],
      },
    ],
  },
  {
    id: 'q4',
    text: {
      ru: 'Что для тебя важнее в учёбе?',
      tk: 'Okuwda seniň üçin näme has möhüm?',
    },
    options: [
      {
        id: 'q4a',
        text: { ru: 'Практика и лаборатории', tk: 'Amal we laboratoriýalar' },
        facultySlugs: ['engineering', 'medicine', 'physics'],
      },
      {
        id: 'q4b',
        text: { ru: 'Творчество и самовыражение', tk: 'Doredijlik we öz-özüňi beýan etmek' },
        facultySlugs: ['design', 'arts', 'journalism'],
      },
      {
        id: 'q4c',
        text: { ru: 'Логика и решение задач', tk: 'Logika we mesele çözmek' },
        facultySlugs: ['computer_science', 'economics', 'law'],
      },
      {
        id: 'q4d',
        text: { ru: 'Общение и работа с людьми', tk: 'Aragatnaşyk we adamlar bilen işlemek' },
        facultySlugs: ['management', 'tourism', 'linguistics'],
      },
    ],
  },
  {
    id: 'q5',
    text: {
      ru: 'Какой ты видишь свою карьеру через 10 лет?',
      tk: '10 ýyldan karýeraňy nähili görýärsiň?',
    },
    options: [
      {
        id: 'q5a',
        text: { ru: 'Руковожу IT-компанией', tk: 'IT kompaniýasyny dolandyrýaryn' },
        facultySlugs: ['computer_science', 'it', 'management'],
      },
      {
        id: 'q5b',
        text: { ru: 'Работаю в международной организации', tk: 'Halkara guramada işleýärin' },
        facultySlugs: ['international_relations', 'law', 'linguistics'],
      },
      {
        id: 'q5c',
        text: { ru: 'Помогаю людям со здоровьем', tk: 'Adamlaryň saglygyna kömek edýärin' },
        facultySlugs: ['medicine', 'pharmacy', 'biology'],
      },
      {
        id: 'q5d',
        text: { ru: 'Создаю свой бизнес', tk: 'Öz işimi döredýärin' },
        facultySlugs: ['economics', 'management', 'marketing'],
      },
    ],
  },
];

// Faculty display names for results
const FACULTY_NAMES: Record<string, Record<Language, string>> = {
  engineering: { ru: 'Инженерия', tk: 'Inženerlik' },
  computer_science: { ru: 'Информатика', tk: 'Informatika' },
  physics: { ru: 'Физика', tk: 'Fizika' },
  medicine: { ru: 'Медицина', tk: 'Lukmançylyk' },
  pharmacy: { ru: 'Фармация', tk: 'Farmasewtika' },
  biology: { ru: 'Биология', tk: 'Biologiýa' },
  linguistics: { ru: 'Лингвистика', tk: 'Lingwistika' },
  journalism: { ru: 'Журналистика', tk: 'Žurnalistika' },
  philology: { ru: 'Филология', tk: 'Filologiýa' },
  economics: { ru: 'Экономика', tk: 'Ykdysadyýet' },
  law: { ru: 'Юриспруденция', tk: 'Hukuk' },
  management: { ru: 'Менеджмент', tk: 'Menejment' },
  it: { ru: 'Информационные технологии', tk: 'IT' },
  design: { ru: 'Дизайн', tk: 'Dizaýn' },
  architecture: { ru: 'Архитектура', tk: 'Arhitektura' },
  arts: { ru: 'Искусство', tk: 'Sungatçylyk' },
  tourism: { ru: 'Туризм', tk: 'Turizm' },
  sports: { ru: 'Физкультура', tk: 'Bedenterbiýe' },
  geography: { ru: 'География', tk: 'Geografiýa' },
  marketing: { ru: 'Маркетинг', tk: 'Marketing' },
  international_relations: { ru: 'Международные отношения', tk: 'Halkara gatnaşyklar' },
  political_science: { ru: 'Политология', tk: 'Syýasaty öwreniş' },
};

export default function QuizPage() {
  const { language } = useAuth();
  const { profile, completeQuest } = useGame();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [topFaculties, setTopFaculties] = useState<{ slug: string; score: number }[]>([]);
  const [achievement, setAchievement] = useState<{
    type: 'quest' | 'badge' | 'level_up';
    title: string;
    description?: string;
    icon?: string;
  } | null>(null);

  const totalSteps = QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + (answers[currentQuestion?.id] ? 1 : 0)) / totalSteps) * 100);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(async () => {
    // Compute scores
    const scores: Record<string, number> = {};
    Object.entries(answers).forEach(([questionId, optionId]) => {
      const question = QUIZ_QUESTIONS.find((q) => q.id === questionId);
      if (!question) return;
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;
      option.facultySlugs.forEach((slug) => {
        scores[slug] = (scores[slug] || 0) + 1;
      });
    });

    // Sort by score, take top 3
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([slug, score]) => ({ slug, score }));

    setTopFaculties(sorted);
    setShowResults(true);

    // Auto-complete quest
    if (profile && !profile.completedQuests.includes('career_quiz')) {
      try {
        await completeQuest('career_quiz');
        const quest = QUESTS.find((q) => q.slug === 'career_quiz');
        if (quest) {
          setAchievement({
            type: 'quest',
            title: localize(quest.title, language),
            description: `+${quest.xpReward} XP`,
            icon: '🏅',
          });
        }
      } catch {
        // Quest may have already been completed
      }
    }
  }, [answers, profile, completeQuest, language]);

  const canProceed = currentQuestion && answers[currentQuestion.id];
  const isLastStep = currentStep === totalSteps - 1;

  if (showResults) {
    const maxScore = topFaculties[0]?.score || 1;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {language === 'ru' ? 'Результаты теста' : 'Test netijeleri'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {language === 'ru'
              ? 'Вот факультеты, которые тебе подходят больше всего'
              : 'Saňa iň laýyk fakultetler'}
          </p>
        </div>

        <div className="mx-auto max-w-lg space-y-4">
          {topFaculties.map((faculty, index) => {
            const name = FACULTY_NAMES[faculty.slug];
            const percent = Math.round((faculty.score / maxScore) * 100);
            return (
              <Card key={faculty.slug} padding="md">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : 'bg-amber-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {name ? localize(name, language) : faculty.slug}
                    </p>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary-600">
                    {faculty.score} {language === 'ru' ? 'б.' : 'b.'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/faculties')}
          >
            {language === 'ru' ? 'Выбрать факультет' : 'Fakultet saýla'}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false);
              setCurrentStep(0);
              setAnswers({});
              setTopFaculties([]);
            }}
          >
            {language === 'ru' ? 'Пройти заново' : 'Gaýtadan geç'}
          </Button>
        </div>

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <BrainCircuit className="h-6 w-6 text-primary-600" />
          {language === 'ru' ? 'Карьерный тест' : 'Hunar testi'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {language === 'ru'
            ? 'Ответь на 5 вопросов и узнай, какой факультет тебе подходит'
            : '5 soraga jogap ber we haýsy fakultetiň saňa laýykdygyny bil'}
        </p>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>
            {language === 'ru' ? 'Вопрос' : 'Sorag'} {currentStep + 1} / {totalSteps}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900">
            {localize(currentQuestion.text, language)}
          </h2>

          <div className="mt-5 space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all duration-200 ${
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {selected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    {localize(option.text, language)}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          {language === 'ru' ? 'Назад' : 'Yza'}
        </Button>

        {isLastStep ? (
          <Button
            variant="primary"
            onClick={handleFinish}
            disabled={!canProceed}
          >
            {language === 'ru' ? 'Завершить' : 'Gutarmak'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {language === 'ru' ? 'Далее' : 'Indiki'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
