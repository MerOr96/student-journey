import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FACULTIES } from '@/data/faculties';

// ─── Данные квиза ────────────────────────────────────────────────
// Каждый вариант ответа начисляет очки факультетам (ID 1–8)
interface QuizOption {
  id: string;
  text: { ru: string; tk: string };
  scores: Record<number, number>; // facultyId → points
}

interface QuizQuestion {
  id: string;
  text: { ru: string; tk: string };
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: {
      ru: 'Какая область тебя привлекает больше всего?',
      tk: 'Haýsy ugur sizi has köp özüne çekýär?',
    },
    options: [
      { id: 'a', text: { ru: 'Технологии и инженерия', tk: 'Tehnologiýa we inženerçilik' }, scores: { 1: 3, 2: 2 } },
      { id: 'b', text: { ru: 'Экономика и бизнес', tk: 'Ykdysadyýet we iş' }, scores: { 3: 3 } },
      { id: 'c', text: { ru: 'Медицина и здоровье', tk: 'Lukmançylyk we saglyk' }, scores: { 8: 3 } },
      { id: 'd', text: { ru: 'Гуманитарные науки и культура', tk: 'Ynsanperwer ylymlar we medeniýet' }, scores: { 5: 2, 6: 2, 7: 2 } },
    ],
  },
  {
    id: 'q2',
    text: {
      ru: 'Что тебе интереснее всего делать?',
      tk: 'Siziň üçin iň gyzykly zat näme?',
    },
    options: [
      { id: 'a', text: { ru: 'Программировать и разрабатывать приложения', tk: 'Programma düzmek we programma işläp düzmek' }, scores: { 2: 3 } },
      { id: 'b', text: { ru: 'Помогать и лечить людей', tk: 'Adamlara kömek etmek we bejermek' }, scores: { 8: 3, 5: 1 } },
      { id: 'c', text: { ru: 'Рисовать, снимать, создавать', tk: 'Çekmek, surata düşürmek, döretmek' }, scores: { 6: 3 } },
      { id: 'd', text: { ru: 'Изучать законы и защищать права', tk: 'Kanuny öwrenmek we hukuklary goramak' }, scores: { 4: 3 } },
    ],
  },
  {
    id: 'q3',
    text: {
      ru: 'Какой предмет нравился тебе больше всего в школе?',
      tk: 'Mekdepde haýsy dersi has gowy görýärdiňiz?',
    },
    options: [
      { id: 'a', text: { ru: 'Математика и физика', tk: 'Matematika we fizika' }, scores: { 1: 2, 2: 3 } },
      { id: 'b', text: { ru: 'Биология и химия', tk: 'Biologiýa we himiýa' }, scores: { 8: 3 } },
      { id: 'c', text: { ru: 'Иностранные языки', tk: 'Daşary ýurt dilleri' }, scores: { 7: 3, 5: 1 } },
      { id: 'd', text: { ru: 'История и обществознание', tk: 'Taryh we jemgyýet öwreniş' }, scores: { 4: 2, 5: 2 } },
    ],
  },
  {
    id: 'q4',
    text: {
      ru: 'Кем ты видишь себя через 10 лет?',
      tk: '10 ýyldan özüňizi kim hökmünde görýärsiňiz?',
    },
    options: [
      { id: 'a', text: { ru: 'Инженер или IT-специалист', tk: 'Inžener ýa-da IT hünärmeni' }, scores: { 1: 2, 2: 3 } },
      { id: 'b', text: { ru: 'Врач или фармацевт', tk: 'Lukman ýa-da farmasewtik' }, scores: { 8: 3 } },
      { id: 'c', text: { ru: 'Руководитель компании', tk: 'Kompaniýanyň ýolbaşçysy' }, scores: { 3: 3 } },
      { id: 'd', text: { ru: 'Переводчик или дипломат', tk: 'Terjimeçi ýa-da diplomat' }, scores: { 7: 3, 5: 1 } },
    ],
  },
  {
    id: 'q5',
    text: {
      ru: 'Как ты предпочитаешь работать?',
      tk: 'Işlemegi nähili halaýarsyňyz?',
    },
    options: [
      { id: 'a', text: { ru: 'С данными, формулами и расчётами', tk: 'Maglumatlar, formulalar we hasaplamalar bilen' }, scores: { 2: 3, 3: 1 } },
      { id: 'b', text: { ru: 'С людьми — общаться и помогать', tk: 'Adamlar bilen — aragatnaşyk we kömek etmek' }, scores: { 5: 3, 8: 1, 7: 1 } },
      { id: 'c', text: { ru: 'С документами и законами', tk: 'Resminamalar we kanunlar bilen' }, scores: { 4: 3 } },
      { id: 'd', text: { ru: 'С механизмами и материалами', tk: 'Mehanizmler we materiallar bilen' }, scores: { 1: 3 } },
    ],
  },
  {
    id: 'q6',
    text: {
      ru: 'Что важнее всего в твоей будущей работе?',
      tk: 'Geljekki işiňizde iň möhüm zat näme?',
    },
    options: [
      { id: 'a', text: { ru: 'Высокий доход', tk: 'Ýokary girdeji' }, scores: { 3: 2, 8: 1, 1: 1 } },
      { id: 'b', text: { ru: 'Помощь обществу', tk: 'Jemgyýete kömek etmek' }, scores: { 8: 2, 5: 2, 4: 1 } },
      { id: 'c', text: { ru: 'Творчество и самовыражение', tk: 'Döredijiliik we özüňi aňlatmak' }, scores: { 6: 3, 7: 1 } },
      { id: 'd', text: { ru: 'Стабильность и карьерный рост', tk: 'Durnuklylyk we karýera ösüşi' }, scores: { 4: 2, 2: 1, 3: 1 } },
    ],
  },
  {
    id: 'q7',
    text: {
      ru: 'Какое слово тебя описывает лучше всего?',
      tk: 'Sizi iň gowy häsiýetlendirýän söz haýsy?',
    },
    options: [
      { id: 'a', text: { ru: 'Аналитик', tk: 'Analitik' }, scores: { 2: 3, 3: 1 } },
      { id: 'b', text: { ru: 'Творец', tk: 'Dörediji' }, scores: { 6: 3, 7: 1 } },
      { id: 'c', text: { ru: 'Защитник', tk: 'Goragçy' }, scores: { 4: 2, 8: 2 } },
      { id: 'd', text: { ru: 'Строитель', tk: 'Gurujy' }, scores: { 1: 3 } },
    ],
  },
  {
    id: 'q8',
    text: {
      ru: 'В какой среде ты хотел бы работать?',
      tk: 'Haýsy gurşawda işlemek isleýärsiňiz?',
    },
    options: [
      { id: 'a', text: { ru: 'Лаборатория или завод', tk: 'Laboratoriýa ýa-da zawod' }, scores: { 1: 3, 8: 1 } },
      { id: 'b', text: { ru: 'Офис или банк', tk: 'Ofis ýa-da bank' }, scores: { 3: 3, 4: 1 } },
      { id: 'c', text: { ru: 'Больница или клиника', tk: 'Keselhanа ýa-da klinika' }, scores: { 8: 3 } },
      { id: 'd', text: { ru: 'IT-компания или творческая студия', tk: 'IT kompaniýa ýa-da döredijilik studiýasy' }, scores: { 2: 2, 6: 2 } },
    ],
  },
];

// ─── Компонент ───────────────────────────────────────────────────
export default function CareerQuizScreen() {
  const { user } = useAuth();
  const { profile, completeQuest } = useGame();
  const lang = (user?.language || 'ru') as 'ru' | 'tk';

  const [step, setStep] = useState(0); // 0..7 = вопросы, 8 = результат
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId → optionId
  const [scores, setScores] = useState<Record<number, number>>({}); // facultyId → total score
  const [completing, setCompleting] = useState(false);
  const [questDone, setQuestDone] = useState(
    profile?.completedQuests.includes('career_quiz') ?? false,
  );

  const currentQuestion = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const isDone = step >= QUESTIONS.length;

  const selectOption = (optionId: string) => {
    const q = QUESTIONS[step];
    const opt = q.options.find((o) => o.id === optionId)!;

    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));

    // Начисляем очки
    const newScores = { ...scores };
    Object.entries(opt.scores).forEach(([fid, pts]) => {
      const id = Number(fid);
      newScores[id] = (newScores[id] || 0) + pts;
    });
    setScores(newScores);

    // Переход
    setTimeout(() => {
      if (isLast) {
        setStep(QUESTIONS.length); // переход к результату
        if (!questDone) handleComplete(newScores);
      } else {
        setStep((s) => s + 1);
      }
    }, 350);
  };

  const handleComplete = async (finalScores: Record<number, number>) => {
    setCompleting(true);
    try {
      const result = await completeQuest('career_quiz');
      if (result) setQuestDone(true);
    } finally {
      setCompleting(false);
    }
  };

  // Топ-3 факультета по очкам
  const topFaculties = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => FACULTIES.find((f) => f.id === Number(id)))
    .filter(Boolean);

  // ── Результаты ──
  if (isDone) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Назад</Text>
          </TouchableOpacity>

          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>🎯</Text>
            <Text style={styles.resultTitle}>
              {lang === 'ru' ? 'Твои результаты' : 'Siziň netijeleriňiz'}
            </Text>
            <Text style={styles.resultSub}>
              {lang === 'ru'
                ? 'На основе ответов мы подобрали подходящие факультеты'
                : 'Jogaplara görä laýyk fakultetleri saýladyk'}
            </Text>
          </View>

          {topFaculties.map((f, i) => f && (
            <Card key={f.id} style={[styles.resultCard, i === 0 && styles.resultCardTop]}>
              <View style={styles.resultRankRow}>
                <Text style={styles.resultRank}>#{i + 1}</Text>
                {i === 0 && (
                  <Text style={styles.bestMatch}>
                    {lang === 'ru' ? '🏆 Лучшее совпадение' : '🏆 Iň gowy gabat gelme'}
                  </Text>
                )}
              </View>
              <Text style={styles.resultFacultyName}>{f.name}</Text>
              <Text style={styles.resultSpecCount}>
                {f.specialtyCount}{' '}
                {lang === 'ru' ? 'направлений подготовки' : 'hünär ugry'}
              </Text>
            </Card>
          ))}

          {questDone && (
            <Card style={styles.xpCard}>
              <Text style={styles.xpCardText}>
                🎉 {lang === 'ru' ? 'Квест выполнен! +60 XP' : 'Quest ýerine ýetirildi! +60 XP'}
              </Text>
            </Card>
          )}
          {completing && <ActivityIndicator color="#0ea5e9" style={{ marginTop: 16 }} />}

          <Button
            onPress={() => router.push('/(app)/(applicant)/faculties')}
            style={styles.goBtn}
          >
            {lang === 'ru' ? 'Перейти к выбору факультета' : 'Fakultet saýlamaga git'}
          </Button>
          <Button variant="secondary" onPress={() => router.back()} style={styles.goBtn}>
            {lang === 'ru' ? 'Вернуться к квестам' : 'Questlere gaýt'}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Вопрос ──
  const selectedOption = answers[currentQuestion.id];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {lang === 'ru' ? 'Карьерный тест' : 'Hünär testi'}
        </Text>

        {/* Прогресс */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{step + 1} / {QUESTIONS.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]} />
          </View>
        </View>

        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.text[lang]}</Text>
        </Card>

        <View style={styles.optionsGap}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.8}
                onPress={() => !selectedOption && selectOption(opt.id)}
                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.text[lang]}
                </Text>
                {isSelected && <Text style={styles.optionCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },

  backBtn: { marginBottom: 4 },
  backText: { color: '#0ea5e9', fontSize: 15, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },

  progressRow: { gap: 6 },
  progressText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#0ea5e9', borderRadius: 3 },

  questionCard: { backgroundColor: '#fff', padding: 20 },
  questionText: { fontSize: 17, fontWeight: '700', color: '#0f172a', lineHeight: 26 },

  optionsGap: { gap: 10 },
  optionBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionBtnSelected: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  optionText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },
  optionTextSelected: { color: '#0369a1', fontWeight: '700' },
  optionCheck: { fontSize: 18, color: '#0ea5e9', marginLeft: 8 },

  // Results
  resultHeader: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  resultEmoji: { fontSize: 56 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  resultSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  resultCard: { gap: 6 },
  resultCardTop: { borderWidth: 2, borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  resultRankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultRank: { fontSize: 22, fontWeight: '800', color: '#94a3b8' },
  bestMatch: { fontSize: 12, fontWeight: '700', color: '#0369a1' },
  resultFacultyName: { fontSize: 16, fontWeight: '700', color: '#0f172a', lineHeight: 22 },
  resultSpecCount: { fontSize: 12, color: '#64748b' },

  xpCard: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', alignItems: 'center' },
  xpCardText: { fontSize: 15, fontWeight: '700', color: '#16a34a' },

  goBtn: { marginTop: 4 },
});
