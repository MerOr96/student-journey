import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { useTranslation } from '@/lib/i18n';

// @ts-ignore
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

type DocType = 'PASSPORT' | 'DIPLOMA' | 'OTHER';

const DOC_LABELS: Record<string, { ru: string, tk: string }> = {
  PASSPORT: { ru: 'Паспорт', tk: 'Pasport' },
  DIPLOMA: { ru: 'Аттестат / Диплом', tk: 'Şahadatnama / Diplom' },
  OTHER: { ru: 'Другое', tk: 'Başga' },
};

const STATUS_MAP: Record<string, { label: string, color: 'default' | 'info' | 'success' | 'danger' }> = {
  pending: { label: 'Ожидает', color: 'info' },
  approved: { label: 'Принят', color: 'success' },
  rejected: { label: 'Отклонен', color: 'danger' },
};

export default function DocumentsScreen() {
  const { user, token } = useAuth();
  const { refreshProfile } = useGame();
  const { t } = useTranslation();
  const lang = (user?.language || 'ru') as 'ru' | 'tk';

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocType | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get<any[]>('/documents');
      if (res.success && res.data) {
        setDocuments(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUpload = async (type: DocType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setUploading(type);

      const formData = new FormData();
      formData.append('type', type);
      
      if (Platform.OS === 'web') {
        formData.append('file', file.file as any);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      }

      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert(
          lang === 'ru' ? 'Успех' : 'Üstünlik',
          lang === 'ru' ? 'Документ успешно загружен' : 'Resminama üstünlikli ýüklendi'
        );
        fetchDocuments();
        refreshProfile(); // to update XP/Quests
      } else {
        Alert.alert('Ошибка', json.message || 'Не удалось загрузить документ');
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Сбой загрузки');
    } finally {
      setUploading(null);
    }
  };

  const deleteDocument = (id: string) => {
    Alert.alert(
      lang === 'ru' ? 'Удаление' : 'Pozmak',
      lang === 'ru' ? 'Вы уверены, что хотите удалить этот документ?' : 'Şu resminamany pozmak isleýärsiňizmi?',
      [
        { text: lang === 'ru' ? 'Отмена' : 'Ýatyrmak', style: 'cancel' },
        {
          text: lang === 'ru' ? 'Удалить' : 'Pozmak',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/documents/${id}`);
              if (res.success) {
                fetchDocuments();
              } else {
                Alert.alert('Ошибка', res.message || 'Сбой удаления');
              }
            } catch (e) {
              Alert.alert('Ошибка', 'Сбой удаления');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{lang === 'ru' ? 'Мои документы' : 'Meniň resminamalarym'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          {lang === 'ru'
            ? 'Загрузите необходимые документы для поступления'
            : 'Okuwa girmek üçin zerur resminamalary ýükläň'}
        </Text>

        {/* Загрузка новых */}
        <Card style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>
            {lang === 'ru' ? 'Загрузить новый документ' : 'Täze resminama ýükle'}
          </Text>
          <View style={styles.uploadRow}>
            <UploadButton
              label={DOC_LABELS.PASSPORT[lang]}
              loading={uploading === 'PASSPORT'}
              emoji="🪪"
              onPress={() => pickAndUpload('PASSPORT')}
            />
            <UploadButton
              label={DOC_LABELS.DIPLOMA[lang]}
              loading={uploading === 'DIPLOMA'}
              emoji="🎓"
              onPress={() => pickAndUpload('DIPLOMA')}
            />
            <UploadButton
              label={DOC_LABELS.OTHER[lang]}
              loading={uploading === 'OTHER'}
              emoji="📎"
              onPress={() => pickAndUpload('OTHER')}
            />
          </View>
        </Card>

        {/* Список загруженных */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          {lang === 'ru' ? 'Загруженные файлы' : 'Ýüklenen faýllar'}
        </Text>

        {loading ? (
          <Text style={styles.emptyText}>Загрузка...</Text>
        ) : documents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48 }}>📄</Text>
            <Text style={styles.emptyText}>
              {lang === 'ru' ? 'Вы еще не загрузили ни одного документа' : 'Siz entek hiç hili resminama ýüklemediňiz'}
            </Text>
          </View>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} style={styles.docItem}>
              <View style={styles.docInfo}>
                <Text style={{ fontSize: 24 }}>📄</Text>
                <View style={styles.docTextCol}>
                  <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                  <Text style={styles.docType}>
                    {DOC_LABELS[doc.type.toUpperCase()]?.[lang] || doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                  </Text>
                  {doc.reviewNote && (
                    <Text style={styles.docNote}>Комментарий: {doc.reviewNote}</Text>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Badge variant={STATUS_MAP[doc.status]?.color || 'default'} style={styles.badge}>
                  {STATUS_MAP[doc.status]?.label || doc.status}
                </Badge>
                <TouchableOpacity onPress={() => deleteDocument(doc.id)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadButton({ label, loading, emoji, onPress }: { label: string, loading: boolean, emoji: string, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.uploadBtn} onPress={onPress} disabled={loading}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={styles.uploadBtnText}>{loading ? 'Загрузка...' : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  uploadCard: { gap: 16 },
  uploadRow: { flexDirection: 'column', gap: 10 },
  uploadBtn: {
    backgroundColor: '#e0f2fe', borderRadius: 12, padding: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12,
    borderWidth: 1, borderColor: '#bae6fd',
  },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#0369a1' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },

  docItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  docInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  docTextCol: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  docType: { fontSize: 12, color: '#64748b' },
  docNote: { fontSize: 12, color: '#ef4444', marginTop: 4, fontStyle: 'italic' },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
});
