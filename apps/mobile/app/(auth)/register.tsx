import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const VELAYATS = [
  { value: 'ahal', label: 'Ахал' },
  { value: 'balkan', label: 'Балкан' },
  { value: 'dashoguz', label: 'Дашогуз' },
  { value: 'lebap', label: 'Лебап' },
  { value: 'mary', label: 'Мары' },
  { value: 'ashgabat', label: 'Ашхабад' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    birthDate: '', velayat: '', language: 'ru' as 'ru' | 'tk',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    setError('');
    if (!form.fullName || !form.email || !form.password) {
      setError('Заполните обязательные поля');
      return;
    }
    if (!consent) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.replace('/(app)/(applicant)/home');
    } catch (e: any) {
      setError(e.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Создать аккаунт</Text>
        <Text style={styles.subtitle}>Начни свой путь к образованию</Text>

        <View style={styles.form}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Input label="ФИО *" value={form.fullName} onChangeText={(v) => set('fullName', v)} placeholder="Иванов Иван Иванович" />
          <Input label="Email *" value={form.email} onChangeText={(v) => set('email', v)} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" containerStyle={styles.gap} />
          <Input label="Пароль *" value={form.password} onChangeText={(v) => set('password', v)} placeholder="Минимум 6 символов" secureTextEntry containerStyle={styles.gap} />
          <Input label="Телефон" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+993 XX XXXXXX" keyboardType="phone-pad" containerStyle={styles.gap} />
          <Input label="Дата рождения" value={form.birthDate} onChangeText={(v) => set('birthDate', v)} placeholder="ДД.ММ.ГГГГ" keyboardType="numbers-and-punctuation" containerStyle={styles.gap} />

          <Text style={styles.fieldLabel}>Велаят</Text>
          <View style={styles.velayatGrid}>
            {VELAYATS.map((v) => (
              <TouchableOpacity
                key={v.value}
                style={[styles.velayatBtn, form.velayat === v.value && styles.velayatBtnActive]}
                onPress={() => set('velayat', v.value)}
              >
                <Text style={[styles.velayatText, form.velayat === v.value && styles.velayatTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Язык</Text>
          <View style={styles.langRow}>
            {(['ru', 'tk'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, form.language === lang && styles.langBtnActive]}
                onPress={() => set('language', lang)}
              >
                <Text style={[styles.langText, form.language === lang && styles.langTextActive]}>
                  {lang === 'ru' ? '🇷🇺 Русский' : '🇹🇲 Türkmen'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(!consent)} activeOpacity={0.8}>
            <View style={[styles.checkbox, consent && styles.checkboxActive]}>
              {consent && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.consentText}>
              Я согласен на обработку{' '}
              <Text style={styles.linkText}>персональных данных</Text>{' '}
              согласно 152-ФЗ и принимаю условия{' '}
              <Text style={styles.linkText}>Пользовательского соглашения</Text>.
            </Text>
          </TouchableOpacity>

          <Button onPress={handleRegister} loading={loading} fullWidth style={styles.submitBtn}>
            Зарегистрироваться
          </Button>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Уже есть аккаунт? <Text style={styles.loginTextBold}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 16, color: '#0ea5e9', fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 24 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#991b1b', fontSize: 14 },
  gap: { marginTop: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#334155', marginTop: 14, marginBottom: 8 },
  velayatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  velayatBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  velayatBtnActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  velayatText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  velayatTextActive: { color: '#0369a1' },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  langText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  langTextActive: { color: '#0369a1' },
  submitBtn: { marginTop: 22 },
  loginLink: { marginTop: 16, alignItems: 'center' },
  loginText: { fontSize: 14, color: '#64748b' },
  loginTextBold: { color: '#0ea5e9', fontWeight: '600' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, gap: 10 },
  checkbox: { 
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, 
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', marginTop: 2 
  },
  checkboxActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  consentText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  linkText: { color: '#0ea5e9', textDecorationLine: 'underline' },
});
