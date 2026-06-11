import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { CrmStudentProfile } from '@student-journey/shared';
import { Ionicons } from '@expo/vector-icons';

export default function StudentProfileScreen() {
  const { user, logout, language, setLanguage, refreshUser } = useAuth();
  const { profile } = useGame();
  const { t } = useTranslation();

  const [crmData, setCrmData] = useState<CrmStudentProfile | null>(null);
  const [loadingCrm, setLoadingCrm] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    phone: user?.phone || '',
    birthDate: user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '',
  });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCrmData();
    }, [])
  );

  const fetchCrmData = async () => {
    try {
      const res = await api.get('/crm/student');
      if (res.success && res.data) {
        setCrmData(res.data as CrmStudentProfile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCrm(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedDate = '';
      if (form.birthDate) {
        const parts = form.birthDate.split('.');
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const res = await api.put('/profile', {
        phone: form.phone,
        ...(parsedDate ? { birthDate: parsedDate } : {}),
      });

      if (res.success) {
        await refreshUser();
        setIsEditing(false);
      } else {
        Alert.alert('Ошибка', res.message || 'Не удалось сохранить');
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('profileTitle')}</Text>

        {/* СТУДЕНЧЕСКИЙ БИЛЕТ (Академическая информация) */}
        <View style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <View>
              <Text style={styles.uniName}>УлГУ</Text>
              <Text style={styles.uniSubtitle}>Ульяновский государственный университет</Text>
            </View>
            <View style={styles.avatarMini}>
               <Text style={styles.avatarMiniText}>
                 {user?.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'}
               </Text>
            </View>
          </View>
          
          <Text style={styles.studentName}>{user?.fullName}</Text>
          <Text style={styles.studentEmail}>{user?.email}</Text>

          {loadingCrm ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
          ) : crmData ? (
            <View style={styles.academicInfo}>
              <View style={styles.academRow}>
                <View style={styles.academCol}>
                  <Text style={styles.academLabel}>Курс</Text>
                  <Text style={styles.academVal}>{crmData.course || '—'}</Text>
                </View>
                <View style={styles.academCol}>
                  <Text style={styles.academLabel}>Группа</Text>
                  <Text style={styles.academVal}>{crmData.study_group || '—'}</Text>
                </View>
                <View style={styles.academCol}>
                  <Text style={styles.academLabel}>Основа</Text>
                  <Text style={styles.academVal}>{crmData.education_form === 'Бюджет' ? 'Бюджет' : 'Контракт'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={styles.academLabel}>Направление / Специальность</Text>
                <Text style={styles.academValLg}>{crmData.specialty || user?.chosenSpecialtyName || '—'}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Данные из деканата недоступны</Text>
          )}
        </View>

        {/* Контактная информация */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('contactsLabel')}</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtn}>✏️ Редактировать</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setIsEditing(false); setForm({ phone: user?.phone || '', birthDate: user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '' }); }}>
                <Text style={styles.cancelBtn}>Отмена</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <>
              <InfoRow label={t('phoneLabel')} value={user?.phone || '—'} />
              <InfoRow label="Дата рождения" value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'} />
              {crmData && crmData.living_address && (
                <InfoRow label="Адрес в РФ" value={crmData.living_address} />
              )}
            </>
          ) : (
            <View style={styles.editForm}>
              <Input 
                label={t('phoneLabel')} 
                value={form.phone} 
                onChangeText={(v) => setForm(f => ({...f, phone: v}))} 
                placeholder="+993 6X XXXX" 
              />
              <View style={styles.gap} />
              <Input 
                label="Дата рождения" 
                value={form.birthDate} 
                onChangeText={(v) => setForm(f => ({...f, birthDate: v}))} 
                placeholder="ДД.ММ.ГГГГ" 
              />
              <Button loading={saving} onPress={handleSave} style={styles.saveBtn}>
                Сохранить
              </Button>
            </View>
          )}
        </Card>

        {/* Language */}
        <Card>
          <Text style={styles.sectionTitle}>{t('languageInterfaceLabel')}</Text>
          <View style={styles.langRow}>
            {(['ru', 'tk'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, language === lang && styles.langBtnActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                  {lang === 'ru' ? '🇷🇺 Русский' : '🇹🇲 Türkmen'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button variant="danger" onPress={logout} fullWidth style={styles.logoutBtn}>
          {t('logout')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  value: { fontSize: 24, fontWeight: '800', color: '#0ea5e9' },
  label: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 14, color: '#64748b', flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  
  idCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  uniName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  uniSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2, maxWidth: 180 },
  avatarMini: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  studentName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  studentEmail: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  
  academicInfo: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 },
  academRow: { flexDirection: 'row', justifyContent: 'space-between' },
  academCol: { flex: 1 },
  academLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  academVal: { fontSize: 16, color: '#fff', fontWeight: '700' },
  academValLg: { fontSize: 15, color: '#f8fafc', fontWeight: '600', lineHeight: 20 },
  errorText: { color: '#ef4444', fontSize: 14, marginTop: 10 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  editBtn: { fontSize: 14, fontWeight: '700', color: '#0ea5e9', paddingVertical: 4 },
  cancelBtn: { fontSize: 14, fontWeight: '700', color: '#94a3b8', paddingVertical: 4 },
  
  statsRow: { flexDirection: 'row', paddingVertical: 8 },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  langBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 2, borderColor: '#f1f5f9', backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  langText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  langTextActive: { color: '#0ea5e9' },
  
  logoutBtn: { marginTop: 12, borderRadius: 14 },
  editForm: { marginTop: 4 },
  gap: { height: 16 },
  saveBtn: { marginTop: 24, borderRadius: 14 },
});
