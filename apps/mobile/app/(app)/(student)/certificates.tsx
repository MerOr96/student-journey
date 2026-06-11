import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import type { CertificateRequest } from '@student-journey/shared';

const REQUEST_TYPES = [
  { value: 'certificate', label: '📋 Справка' },
  { value: 'petition', label: '📝 Ходатайство' },
  { value: 'other', label: '📌 Другое' },
];

export default function CertificatesScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('certificate');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await api.get<CertificateRequest[]>('/certificates');
    if (res.success && res.data) setRequests(res.data);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!description.trim()) { Alert.alert('Ошибка', 'Опишите что нужно'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/certificates', {
        email: user?.email,
        request_type: type,
        description: description.trim(),
      });
      if (res.success) {
        Alert.alert('Заявка подана', 'Мы обработаем её в ближайшее время');
        setDescription('');
        setShowForm(false);
        await load();
      } else {
        Alert.alert('Ошибка', res.message || 'Не удалось отправить');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Справки</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Заказать'}</Text>
          </TouchableOpacity>
        </View>

        {/* Форма заказа */}
        {showForm && (
          <Card style={styles.form}>
            <Text style={styles.formTitle}>Новая заявка</Text>
            <View style={styles.typeRow}>
              {REQUEST_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={[styles.typeText, type === t.value && styles.typeTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Опишите что нужно..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
            <Button onPress={submit} loading={submitting} fullWidth>
              Отправить заявку
            </Button>
          </Card>
        )}

        {!loading && requests.length === 0 && !showForm && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Нет заявок</Text>
            <Text style={styles.emptyText}>Нажмите «+ Заказать» чтобы подать заявку</Text>
          </Card>
        )}

        {requests.map((r) => (
          <Card key={r.id} style={styles.reqCard}>
            <View style={styles.reqHeader}>
              <Text style={styles.reqType}>{r.request_type_display}</Text>
              <Badge variant={statusVariant(r.status)}>{r.status_display}</Badge>
            </View>
            <Text style={styles.reqDesc}>{r.description}</Text>
            <Text style={styles.reqDate}>
              {new Date(r.created_at).toLocaleDateString('ru-RU')}
            </Text>
            {r.admin_note && (
              <Text style={styles.reqNote}>💬 {r.admin_note}</Text>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusVariant(s: string): 'info' | 'warning' | 'success' | 'default' {
  if (s === 'ready' || s === 'issued') return 'success';
  if (s === 'processing') return 'warning';
  return 'info';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 32, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  addBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  form: { gap: 12 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  typeBtnActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  typeText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  typeTextActive: { color: '#0369a1' },
  textArea: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80,
    textAlignVertical: 'top', backgroundColor: '#f8fafc',
  },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  reqCard: { gap: 6 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqType: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  reqDesc: { fontSize: 13, color: '#475569' },
  reqDate: { fontSize: 12, color: '#94a3b8' },
  reqNote: { fontSize: 13, color: '#0369a1', backgroundColor: '#e0f2fe', padding: 8, borderRadius: 6 },
});
