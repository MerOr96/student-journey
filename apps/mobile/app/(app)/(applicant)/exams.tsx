import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Exam } from '@student-journey/shared';

export default function ExamsScreen() {
  const { lang } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.success && res.data) {
        setExams(res.data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdf = (url: string) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
      }
    >
      <Text style={styles.title}>
        {lang === 'ru' ? 'Вступительные испытания' : 'Giriş synaglary'}
      </Text>

      {exams.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {lang === 'ru' 
              ? 'Экзамены пока не назначены. Ожидайте уведомления.' 
              : 'Heniz synag bellenilmedi. Duýduryşa garaşyň.'}
          </Text>
        </View>
      ) : (
        exams.map((exam) => (
          <View key={exam.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.subject}>{exam.subject}</Text>
              <Text style={styles.status}>
                {exam.status === 'PASSED' ? '✅ СДАН' : exam.status === 'FAILED' ? '❌ НЕ СДАН' : 'ОЖИДАЕТСЯ'}
              </Text>
            </View>

            <Text style={styles.date}>
              📅 {new Date(exam.examDate).toLocaleString(lang === 'ru' ? 'ru-RU' : 'tk-TM')}
            </Text>

            {exam.score !== null && (
              <Text style={styles.score}>Баллы: {exam.score}</Text>
            )}

            {exam.meetingLink && exam.status === 'PENDING' && (
              <TouchableOpacity 
                style={styles.zoomBtn} 
                onPress={() => Linking.openURL(exam.meetingLink!)}
              >
                <Text style={styles.zoomBtnText}>Подключиться (Zoom)</Text>
              </TouchableOpacity>
            )}

            {/* Материалы для подготовки (5 тем по русскому) */}
            {exam.materials && exam.materials.length > 0 && (
              <View style={styles.materialsSection}>
                <Text style={styles.materialsTitle}>Материалы для подготовки:</Text>
                {exam.materials.map((m: any, idx: number) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.materialItem} 
                    onPress={() => handleOpenPdf(m.url)}
                  >
                    <Text style={styles.materialIcon}>📄</Text>
                    <Text style={styles.materialName}>{m.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 20, marginTop: 40 },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subject: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  status: { fontSize: 12, fontWeight: '700', color: '#0ea5e9' },
  date: { fontSize: 15, color: '#475569', marginBottom: 8 },
  score: { fontSize: 16, fontWeight: '700', color: '#22c55e', marginBottom: 12 },
  zoomBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  zoomBtnText: { color: '#fff', fontWeight: '600' },
  materialsSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  materialsTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 },
  materialItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 8 },
  materialIcon: { fontSize: 20, marginRight: 10 },
  materialName: { fontSize: 15, color: '#0f172a', flex: 1 },
});
