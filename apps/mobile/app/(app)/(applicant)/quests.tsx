import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QUESTS, BADGES, canStartQuest } from '@student-journey/shared';
import type { Quest } from '@student-journey/shared';

// ─── Мета для каждого квеста ─────────────────────────────────────
// action = квест выполняется сам при действии → показываем кнопку-навигацию
// screen = квест требует открыть экран
type QuestBehavior =
  | { type: 'action'; tab: string; label: { ru: string; tk: string } }
  | { type: 'screen'; path: string }
  | { type: 'external'; url: string; label: { ru: string; tk: string } };

const QUEST_META: Record<string, QuestBehavior> = {
  upload_passport: {
    type: 'screen',
    path: '/(app)/(applicant)/documents',
  },
  submit_documents: {
    type: 'screen',
    path: '/(app)/(applicant)/documents',
  },
  choose_faculty: {
    type: 'action',
    tab: '/(app)/(applicant)/faculties',
    label: { ru: 'Выбрать факультет', tk: 'Fakultet saýla' },
  },
  career_quiz: {
    type: 'screen',
    path: '/(app)/(applicant)/career-quiz',
  },
  join_imo_channel: {
    type: 'external',
    url: 'https://s.channelcom.tech/HdAdii?from=TG',
    label: { ru: 'Присоединиться', tk: 'Goşul' },
  },
  chat_with_advisor: {
    type: 'screen',
    path: '/(app)/(applicant)/advisor-chat',
  },
  invite_friend: {
    type: 'screen',
    path: '/(app)/(applicant)/invite-friend',
  },
  application_approved: {
    type: 'action',
    tab: '/(app)/(applicant)/quests',
    label: { ru: 'Ждать решения', tk: 'Netijä garaş' },
  },
};

export default function QuestsScreen() {
  const { user } = useAuth();
  const { profile, refreshProfile, completeQuest } = useGame();
  const lang = (user?.language || 'ru') as 'ru' | 'tk';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const completed = profile?.completedQuests ?? [];
  const totalXp = QUESTS.filter((q) => completed.includes(q.slug)).reduce((acc, q) => acc + q.xpReward, 0);
  const progressPct = Math.round((completed.length / QUESTS.length) * 100);

  const selectedCompleted = selectedQuest ? completed.includes(selectedQuest.slug) : false;
  const selectedAvailable = selectedQuest && profile ? canStartQuest(profile, selectedQuest.slug) : false;
  const selectedBadge = selectedQuest?.badgeSlug ? BADGES.find((b) => b.slug === selectedQuest.badgeSlug) : null;
  const selectedMeta = selectedQuest ? QUEST_META[selectedQuest.slug] : null;

  const handleAction = async () => {
    setSelectedQuest(null);
    if (!selectedMeta) return;
    if (selectedMeta.type === 'action') {
      router.push(selectedMeta.tab as any);
    } else if (selectedMeta.type === 'screen') {
      router.push(selectedMeta.path as any);
    } else if (selectedMeta.type === 'external') {
      const { Linking } = require('react-native');
      Linking.openURL(selectedMeta.url);
      if (selectedQuest?.slug) {
        await completeQuest(selectedQuest.slug);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>{lang === 'ru' ? 'Квесты' : 'Questler'}</Text>
        <Text style={styles.subtitle}>
          {lang === 'ru' ? 'Выполняй задания и получай XP' : 'Tabşyryklary ýerine ýetir we XP al'}
        </Text>

        {/* Общий прогресс */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {lang === 'ru' ? 'Прогресс' : 'Ösüş'}
            </Text>
            <Text style={styles.progressCount}>{completed.length} / {QUESTS.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressXp}>
            {lang === 'ru' ? `Заработано: ${totalXp} XP` : `Gazanyldy: ${totalXp} XP`}
          </Text>
        </Card>

        {/* Список квестов */}
        {QUESTS.map((quest) => {
          const done = completed.includes(quest.slug);
          const available = profile ? canStartQuest(profile, quest.slug) : false;
          const meta = QUEST_META[quest.slug];
          const isScreen = meta?.type === 'screen';

          return (
            <TouchableOpacity
              key={quest.slug}
              activeOpacity={0.75}
              onPress={() => setSelectedQuest(quest)}
            >
              <Card style={[styles.questCard, done && styles.questDone]}>
                <View style={styles.questHeader}>
                  <Text style={styles.questTitle} numberOfLines={2}>
                    {quest.title[lang]}
                  </Text>
                  {done ? (
                    <Badge variant="success">✓</Badge>
                  ) : available ? (
                    <Badge variant={isScreen ? 'info' : 'default'}>
                      {isScreen ? (lang === 'ru' ? '▶ Начать' : '▶ Başla') : (lang === 'ru' ? 'К действию' : 'Çäre')}
                    </Badge>
                  ) : (
                    <Badge variant="default">🔒</Badge>
                  )}
                </View>
                <Text style={styles.questDesc} numberOfLines={2}>
                  {quest.description[lang]}
                </Text>
                <View style={styles.questFooter}>
                  <Text style={styles.xpReward}>+{quest.xpReward} XP</Text>
                  {!done && available && (
                    <Text style={styles.tapHint}>
                      {lang === 'ru' ? 'Подробнее →' : 'Giňişleýin →'}
                    </Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Детали квеста ── */}
      <Modal
        visible={!!selectedQuest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedQuest(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedQuest(null)}>
          <Pressable style={styles.sheet} onPress={() => { }}>
            {/* Статус */}
            <View style={styles.sheetStatusRow}>
              {selectedCompleted ? (
                <Badge variant="success">✓ {lang === 'ru' ? 'Выполнено' : 'Ýerine ýetirildi'}</Badge>
              ) : selectedAvailable ? (
                <Badge variant="info">{lang === 'ru' ? 'Доступно' : 'Elýeterli'}</Badge>
              ) : (
                <Badge variant="default">🔒 {lang === 'ru' ? 'Недоступно' : 'Elýetersiz'}</Badge>
              )}
              <Text style={styles.sheetXp}>+{selectedQuest?.xpReward} XP</Text>
            </View>

            {/* Название и описание */}
            <Text style={styles.sheetTitle}>{selectedQuest?.title[lang]}</Text>
            <Text style={styles.sheetDesc}>{selectedQuest?.description[lang]}</Text>

            {/* Инструкция для авто-квестов */}
            {!selectedCompleted && selectedAvailable && selectedMeta?.type === 'action' && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  💡 {lang === 'ru'
                    ? 'Этот квест выполнится автоматически, когда ты совершишь нужное действие'
                    : 'Bu quest zerur hereketleri ýerine ýetireniňde awtomatiki tamamlanar'}
                </Text>
              </View>
            )}

            {/* Бейдж */}
            {selectedBadge && (
              <View style={styles.badgeRow}>
                <Text style={styles.badgeIcon}>{selectedBadge.icon}</Text>
                <View>
                  <Text style={styles.badgeLabel}>
                    {lang === 'ru' ? 'Награда' : 'Sylag'}
                  </Text>
                  <Text style={styles.badgeName}>{selectedBadge.title[lang]}</Text>
                </View>
              </View>
            )}

            {/* Кнопки */}
            <View style={styles.sheetActions}>
              {!selectedCompleted && selectedAvailable && (
                <Button onPress={handleAction} style={styles.actionBtn}>
                  {selectedMeta?.type === 'screen'
                    ? (lang === 'ru' ? '▶ Начать квест' : '▶ Questi başla')
                    : (selectedMeta as any)?.label?.[lang] ?? (lang === 'ru' ? 'Перейти' : 'Git')}
                </Button>
              )}
              <Button variant="secondary" onPress={() => setSelectedQuest(null)}>
                {lang === 'ru' ? 'Закрыть' : 'Ýap'}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },

  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 4 },

  progressCard: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#0ea5e9' },
  progressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#0ea5e9', borderRadius: 4 },
  progressXp: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },

  questCard: { gap: 8 },
  questDone: { opacity: 0.6 },
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  questTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 },
  questDesc: { fontSize: 13, color: '#475569', lineHeight: 18 },
  questFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpReward: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  tapHint: { fontSize: 12, color: '#94a3b8' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 14,
  },
  sheetStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetXp: { fontSize: 22, fontWeight: '800', color: '#f59e0b' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sheetDesc: { fontSize: 14, color: '#475569', lineHeight: 22 },

  hintBox: { backgroundColor: '#f0f9ff', borderRadius: 10, padding: 12 },
  hintText: { fontSize: 13, color: '#0369a1', lineHeight: 20 },

  badgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fefce8', borderRadius: 12, padding: 12,
  },
  badgeIcon: { fontSize: 32 },
  badgeLabel: { fontSize: 11, color: '#a16207' },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#713f12' },

  sheetActions: { gap: 10, marginTop: 4 },
  actionBtn: {},
});
