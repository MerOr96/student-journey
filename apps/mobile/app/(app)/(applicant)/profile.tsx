import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function ProfileScreen() {
  const { user, logout, language, setLanguage, refreshUser } = useAuth();
  const { profile } = useGame();
  const { t } = useTranslation();
  const isStudent = user?.appRole === 'student';

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    phone: user?.phone || '',
    velayat: user?.velayat || '',
    birthDate: user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '',
  });
  const [loading, setLoading] = useState(false);

  // При открытии вкладки профиля — проверяем роль с сервера (только абитуриентам)
  useFocusEffect(
    useCallback(() => {
      if (user?.appRole !== 'applicant') return;
      refreshUser().then((updated) => {
        if (updated?.appRole === 'student') {
          router.replace('/(app)/(student)/home');
        } else if (updated) {
           setForm({
             phone: updated.phone || '',
             velayat: updated.velayat || '',
             birthDate: updated.birthDate ? new Date(updated.birthDate).toLocaleDateString('ru-RU') : '',
           });
        }
      });
    }, [user?.appRole]),
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      // Парсинг даты (ДД.ММ.ГГГГ -> YYYY-MM-DD)
      let parsedDate = '';
      if (form.birthDate) {
        const parts = form.birthDate.split('.');
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const res = await api.put('/profile', {
        phone: form.phone,
        velayat: form.velayat,
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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('profileTitle')}</Text>

        {/* Avatar block */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <Badge variant={isStudent ? 'success' : 'info'} style={styles.roleBadge}>
            {isStudent ? t('roleStudent') : t('roleApplicant')}
          </Badge>
          
          {user?.chosenFacultyName && (
            <Text style={styles.facultyText}>🎓 {user.chosenFacultyName}</Text>
          )}
          {user?.chosenSpecialtyName && (
            <Text style={styles.specialtyText}>{user.chosenSpecialtyName}</Text>
          )}
        </Card>

        {/* Game stats (только для абитуриентов) */}
        {!isStudent && profile && (
          <Card>
            <Text style={styles.sectionTitle}>{t('gameProgressLabel')}</Text>
            <View style={styles.statsRow}>
              <StatItem label={t('xpLabel')} value={String(profile.xp)} />
              <StatItem label={t('actionQuests')} value={String(profile.completedQuests.length)} />
              <StatItem label={t('badgesLabel')} value={String(profile.badges.length)} />
            </View>
          </Card>
        )}

        {/* Contact info */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('contactsLabel')}</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtn}>✏️ Редактировать</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setIsEditing(false); setForm({ phone: user?.phone || '', velayat: user?.velayat || '', birthDate: user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '' }); }}>
                <Text style={styles.cancelBtn}>Отмена</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <>
              <InfoRow label={t('phoneLabel')} value={user?.phone || '—'} />
              <InfoRow label={t('velayatLabel')} value={user?.velayat || '—'} />
              <InfoRow label="Дата рождения" value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'} />
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
              <View style={styles.gap} />
              <Input 
                label={t('velayatLabel')} 
                value={form.velayat} 
                onChangeText={(v) => setForm(f => ({...f, velayat: v}))} 
                placeholder="Например, Ахал" 
              />
              <Button loading={loading} onPress={handleSave} style={styles.saveBtn}>
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
  value: { fontSize: 22, fontWeight: '800', color: '#0ea5e9' },
  label: { fontSize: 12, color: '#64748b', marginTop: 2 },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 14, color: '#64748b' },
  value: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 32, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  avatarCard: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b' },
  roleBadge: { marginTop: 4 },
  facultyText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#0369a1', textAlign: 'center' },
  specialtyText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  editBtn: { fontSize: 14, fontWeight: '600', color: '#0ea5e9' },
  cancelBtn: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  statsRow: { flexDirection: 'row' },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  langText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  langTextActive: { color: '#0369a1' },
  logoutBtn: { marginTop: 8 },
  editForm: { marginTop: 4 },
  gap: { height: 12 },
  saveBtn: { marginTop: 16 },
});

