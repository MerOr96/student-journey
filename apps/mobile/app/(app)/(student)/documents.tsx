import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { CrmStudentProfile } from '@student-journey/shared';
import { useTranslation } from '@/lib/i18n';
import * as DocumentPicker from 'expo-document-picker';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const [studentData, setStudentData] = useState<CrmStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const res = await api.get<CrmStudentProfile>('/crm/student');
    if (res.success && res.data) setStudentData(res.data);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingDocs = studentData?.pending_document_uploads || [];

  const handleUpload = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as any);
      formData.append('doc_type', docType);

      setRefreshing(true);
      const res = await api.post('/crm/student/upload', formData);
      if (res.success) {
        Alert.alert('Успех', 'Скан успешно загружен и отправлен на проверку.');
        await load();
      } else {
        Alert.alert('Ошибка', res.message || 'Не удалось загрузить скан');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Произошла ошибка при выборе файла');
    } finally {
      setRefreshing(false);
    }
  };

  const docsList = studentData ? [
    { id: 'passport', label: 'Паспорт', date: studentData.passport_valid_until, subtitle: studentData.passport_number },
    { id: 'visa', label: 'Виза', date: studentData.visa_end },
    { id: 'migration_card', label: 'Миграционная карта', date: studentData.migration_card_end },
    { id: 'registration', label: 'Регистрация', date: studentData.registration_expiry, subtitle: studentData.living_address },
    { id: 'fingerprint', label: 'Дактилоскопия', date: studentData.fingerprint_end },
    { id: 'medical_exam', label: 'Медосмотр', date: studentData.medical_exam_expiry },
    { id: 'insurance', label: 'Страховка', date: studentData.insurance_end },
  ] : [];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        <Text style={styles.title}>Мои документы</Text>
        <Text style={styles.subtitle}>Сроки действия ваших официальных документов</Text>

        {loading && <Text style={styles.loadingText}>Загрузка...</Text>}

        {!loading && studentData && (
          <View style={styles.grid}>
            {docsList.map((doc, idx) => (
              <DocItem
                key={idx}
                label={doc.label}
                date={doc.date}
                subtitle={doc.subtitle}
                isPending={pendingDocs.includes(doc.id)}
                onUpload={() => handleUpload(doc.id)}
                t={t}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DocItem({ label, date, subtitle, isPending, onUpload, t }: any) {
  let content;

  if (!date) {
    content = (
      <>
        <Badge variant="default" style={{ alignSelf: 'flex-start' }}>Нет данных</Badge>
        <Text style={styles.docDate}>Напишите нам</Text>
      </>
    );
  } else {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const daysLeft = Math.round((targetDate.getTime() - today.getTime()) / 86400000);

    const variant = daysLeft < 0 ? 'danger' : daysLeft < 30 ? 'warning' : 'success';
    const statusText = daysLeft < 0 ? t('docExpired') : daysLeft === 0 ? t('docToday') : t('docDaysLeft', { days: daysLeft });

    content = (
      <>
        <Badge variant={variant} style={{ alignSelf: 'flex-start' }}>{statusText}</Badge>
        <Text style={styles.docDate}>Годен до: {targetDate.toLocaleDateString('ru-RU')}</Text>
      </>
    );
  }

  return (
    <Card style={styles.docCard}>
      <View style={styles.docRow}>
        <View style={styles.docInfo}>
          <Text style={styles.docType}>{label}</Text>
          {subtitle ? <Text style={styles.docSubtitle}>{subtitle}</Text> : null}
          <View style={styles.statusRow}>
            {content}
          </View>
        </View>

        <View style={styles.uploadBlock}>
          {isPending ? (
            <View style={styles.pendingCircle}>
              <Text style={styles.pendingIcon}>⏳</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
              <Text style={styles.uploadIcon}>📎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 32, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  loadingText: { color: '#64748b', textAlign: 'center' },
  grid: { gap: 12 },
  docCard: { paddingVertical: 14, paddingHorizontal: 16 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docInfo: { flex: 1, gap: 4 },
  docType: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  docSubtitle: { fontSize: 13, color: '#475569', marginBottom: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  docDate: { fontSize: 13, color: '#64748b' },
  uploadBlock: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { backgroundColor: '#e0f2fe', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  uploadIcon: { fontSize: 20 },
  pendingCircle: { backgroundColor: '#fef3c7', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fde68a' },
  pendingIcon: { fontSize: 18 },
});
