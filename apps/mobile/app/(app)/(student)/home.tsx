import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useTranslation, TranslationKey } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { CrmStudentProfile } from '@student-journey/shared';

export default function StudentHomeScreen() {
  const { user, refreshUser } = useAuth();
  const { t, lang } = useTranslation();
  const [studentData, setStudentData] = useState<CrmStudentProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

    const [activeDay, setActiveDay] = useState<'today' | 'tomorrow'>('today');

  const load = async () => {
    await refreshUser();
    const res = await api.get<CrmStudentProfile>('/crm/student');
    if (res.success && res.data) setStudentData(res.data);

    try {
      const notifRes = await api.get('/notifications/unread-count');
      if (notifRes.success && notifRes.data) {
        setUnreadCount((notifRes.data as any).count);
      }
    } catch (e) { }


  };

  useEffect(() => {
    load().finally(() => setLoading(false));

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
            <Text style={styles.subGreeting}>{t('studentDashboard')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.langBadge, { marginRight: 12 }]}>
              <Text style={styles.langText}>{lang.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/(app)/(student)/messages')}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Карточка студента */}
        {studentData && (
          <Card style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {studentData.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentData.full_name}</Text>
                <Text style={styles.studentSpecialty}>{studentData.specialty}</Text>
                <Text style={styles.studentMeta}>
                  {studentData.course} курс · Группа {studentData.study_group || '—'}
                </Text>
              </View>
            </View>

            {/* Сроки документов */}
            <View style={styles.divider} />
            <Text style={styles.expiryTitle}>{t('docDeadlinesLabel')}</Text>
            <View style={styles.expiryRow}>
              <ExpiryItem label={t('docVisa')} date={studentData.visa_end} t={t} />
              <ExpiryItem label={t('docInsurance')} date={studentData.insurance_end} t={t} />
              <ExpiryItem label={t('docRegistration')} date={studentData.registration_expiry} t={t} />
              <ExpiryItem label={t('docMedical')} date={studentData.medical_exam_expiry} t={t} />
            </View>
          </Card>
        )}

        {!loading && !studentData && (
          <Card style={styles.noDataCard}>
            <Text style={styles.noDataEmoji}>📋</Text>
            <Text style={styles.noDataTitle}>{t('dataLoadingTitle')}</Text>
            <Text style={styles.noDataText}>
              {t('dataLoadingText')}
            </Text>
          </Card>
        )}



        {/* Быстрые действия */}
        <Text style={styles.sectionTitle}>{t('quickActionsLabel')}</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            emoji="📋" label={t('actionCertificate')} color="#e0f2fe"
            onPress={() => router.push('/(app)/(student)/certificates')}
          />
          <QuickAction
            emoji="💬" label={lang === 'ru' ? 'Сообщения' : 'Hatlar'} color="#f0fdf4"
            onPress={() => router.push('/(app)/(student)/messages')}
          />
          <QuickAction
            emoji="📄" label={t('actionDocuments')} color="#fef3c7"
            onPress={() => router.push('/(app)/(student)/documents')}
          />
          <QuickAction
            emoji="👤" label={t('actionProfile')} color="#faf5ff"
            onPress={() => router.push('/(app)/(student)/profile')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



function ExpiryItem({ label, date, t }: { label: string; date: string | null; t: (k: TranslationKey, v?: any) => string }) {
  if (!date) {
    return (
      <View style={[expiryStyles.item, { minWidth: '45%' }]}>
        <Text style={expiryStyles.label}>{label}</Text>
        <Badge variant="default" style={{ alignSelf: 'center', marginVertical: 2 }}>—</Badge>
      </View>
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = date.split('T')[0].split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const daysLeft = Math.round((targetDate.getTime() - today.getTime()) / 86400000);

  const variant = daysLeft < 0 ? 'danger' : daysLeft < 30 ? 'warning' : 'success';
  return (
    <View style={[expiryStyles.item, { minWidth: '45%' }]}>
      <Text style={expiryStyles.label}>{label}</Text>
      <Badge variant={variant} style={{ alignSelf: 'center', marginVertical: 2 }}>
        {daysLeft < 0 ? t('docExpired') : daysLeft === 0 ? t('docToday') : t('docDaysLeft', { days: daysLeft })}
      </Badge>
      <Text style={expiryStyles.date}>{targetDate.toLocaleDateString('ru-RU')}</Text>
    </View>
  );
}

const expiryStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1, gap: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  date: { fontSize: 10, color: '#94a3b8' },
});

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

  studentCard: {},
  studentHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  studentAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  studentSpecialty: { fontSize: 13, color: '#475569', marginTop: 2 },
  studentMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  expiryTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  expiryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  noDataCard: { alignItems: 'center', paddingVertical: 24 },
  noDataEmoji: { fontSize: 40, marginBottom: 8 },
  noDataTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  noDataText: { fontSize: 13, color: '#64748b', textAlign: 'center' },



  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },
});

