import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { useTranslation, TranslationKey } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ApplicationStatus } from '@student-journey/shared';
import { getLevelForXp, getNextLevel, getXpProgressPercent, localize } from '@student-journey/shared';
import { api } from '@/lib/api';

export default function ApplicantHomeScreen() {
  const { user, refreshUser } = useAuth();
  const { profile, refreshProfile } = useGame();
  const { t, lang } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    await Promise.all([refreshProfile(), refreshUser()]);
    if (user?.applicationStatus === 'ACCEPTED') {
      try {
        const res = await api.get('/notifications/unread-count');
        if (res.success && res.data) {
          setUnreadCount((res.data as any).count);
        }
      } catch (err) {}
    }
  };

  useEffect(() => { 
    load(); 
    
    const sub = DeviceEventEmitter.addListener('messagesRead', () => {
      setUnreadCount(0);
    });
    return () => sub.remove();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const appStatus = (user?.applicationStatus || 'NEW') as ApplicationStatus;
  const isAccepted = appStatus === 'ACCEPTED';

  const levelInfo = profile ? getLevelForXp(profile.xp) : null;
  const nextLevel = levelInfo ? getNextLevel(levelInfo.slug) : null;
  const xpPercent = profile ? getXpProgressPercent(profile.xp) : 0;
  const xpToNext = nextLevel ? nextLevel.minXp - profile!.xp : 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {/* Приветствие */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('greeting')}, {user?.fullName?.split(' ')[0]} 👋
            </Text>
            <Text style={styles.subGreeting}>{t('journeySubtitle')}</Text>
          </View>
          
          {isAccepted ? (
            <TouchableOpacity 
              style={styles.bellBtn} 
              onPress={() => router.push('/(app)/(applicant)/messages')}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          ) : (
            <View style={styles.langBadge}>
              <Text style={styles.langText}>{lang.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Статус заявки */}
        <Card>
          <Text style={styles.sectionLabel}>{t('appStatusLabel')}</Text>
          <Badge variant={statusVariant(appStatus)} style={styles.statusBadge}>
            {translateStatus(appStatus, t)}
          </Badge>
          <Text style={styles.statusHint}>{statusHint(appStatus, t)}</Text>
        </Card>

        {isAccepted ? (
          /* ДАШБОРД ЗАЧИСЛЕНИЯ (ФАЗА 2) */
          <>
            <Text style={styles.sectionTitle}>Что нужно сделать:</Text>
            <View style={styles.actionsGrid}>
              <QuickAction 
                emoji="📄" 
                label={lang === 'ru' ? 'Документы' : 'Resminamalar'} 
                color="#f0fdf4" 
                onPress={() => router.push('/(app)/(applicant)/documents')} 
              />
              <QuickAction 
                emoji="📝" 
                label={lang === 'ru' ? 'Экзамены' : 'Synaglar'} 
                color="#e0f2fe" 
                onPress={() => router.push('/(app)/(applicant)/exams')} 
              />
              <QuickAction 
                emoji="💬" 
                label={lang === 'ru' ? 'Сообщения' : 'Hatlar'} 
                color="#fef3c7" 
                onPress={() => router.push('/(app)/(applicant)/messages')} 
              />
            </View>
          </>
        ) : (
          /* ИГРОВОЙ ДАШБОРД (ФАЗА 1) */
          <>
            {profile && levelInfo && (
              <Card style={styles.xpCard}>
                <View style={styles.xpRow}>
                  <Text style={styles.levelEmoji}>{levelInfo.icon}</Text>
                  <View style={styles.xpInfo}>
                    <Text style={styles.levelTitle}>{localize(levelInfo.title, lang)}</Text>
                    <Text style={styles.xpCount}>{profile.xp} XP</Text>
                  </View>
                  <Text style={styles.xpPercent}>{xpPercent}%</Text>
                </View>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${xpPercent}%` as any }]} />
                </View>
                <Text style={styles.xpNext}>
                  {nextLevel ? t('xpToNextLevel', { level: localize(nextLevel.title, lang), xp: xpToNext }) : t('maxLevel')}
                </Text>
              </Card>
            )}

            <Text style={styles.sectionTitle}>{t('quickActionsLabel')}</Text>
            <View style={styles.actionsGrid}>
              <QuickAction emoji="⚡" label={t('actionQuests')} color="#fef3c7" onPress={() => router.push('/(app)/(applicant)/quests')} />
              <QuickAction emoji="🎓" label={t('actionFaculties')} color="#e0f2fe" onPress={() => router.push('/(app)/(applicant)/faculties')} />
              <QuickAction emoji="👤" label={t('actionProfile')} color="#f0fdf4" onPress={() => router.push('/(app)/(applicant)/profile')} />
            </View>

            {profile && profile.completedQuests.length > 0 && (
              <Card>
                <Text style={styles.sectionLabel}>{t('progressLabel')}</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {t('questsCompleted')} <Text style={styles.progressBold}>{profile.completedQuests.length}</Text>
                  </Text>
                  <Text style={styles.progressText}>
                    {t('badgesCount')} <Text style={styles.progressBold}>{profile.badges.length}</Text>
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  emoji, label, color, onPress,
}: { emoji: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function statusVariant(s: ApplicationStatus): 'info' | 'warning' | 'success' | 'danger' | 'default' {
  if (s === 'ACCEPTED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'DOCUMENTS_REVIEW') return 'warning';
  if (s === 'IN_PROGRESS') return 'info';
  return 'default';
}

function translateStatus(s: ApplicationStatus, t: (k: TranslationKey) => string): string {
  const map: Record<ApplicationStatus, TranslationKey> = {
    NEW: 'statusNew',
    IN_PROGRESS: 'statusInProgress',
    DOCUMENTS_REVIEW: 'statusDocumentsReview',
    ACCEPTED: 'statusAccepted',
    REJECTED: 'statusRejected',
  };
  return t(map[s]) || s;
}

function statusHint(s: ApplicationStatus, t: (k: TranslationKey) => string): string {
  const map: Record<ApplicationStatus, TranslationKey> = {
    NEW: 'hintNew',
    IN_PROGRESS: 'hintInProgress',
    DOCUMENTS_REVIEW: 'hintDocumentsReview',
    ACCEPTED: 'hintAccepted',
    REJECTED: 'hintRejected',
  };
  return t(map[s]) || '';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 32, gap: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  subGreeting: { fontSize: 13, color: '#64748b', marginTop: 2 },
  langBadge: { backgroundColor: '#0ea5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  bellBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  bellIcon: { fontSize: 22 },
  bellBadge: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 5, borderWidth: 2, borderColor: '#fff' },

  xpCard: { backgroundColor: '#0ea5e9' },
  xpRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  levelEmoji: { fontSize: 34, marginRight: 12 },
  xpInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  xpCount: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  xpPercent: { fontSize: 18, fontWeight: '800', color: '#fff' },
  xpBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  xpNext: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { marginBottom: 8 },
  statusHint: { fontSize: 13, color: '#64748b', lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },

  progressRow: { flexDirection: 'row', gap: 24 },
  progressText: { fontSize: 14, color: '#475569' },
  progressBold: { fontWeight: '700', color: '#0f172a' },
});

