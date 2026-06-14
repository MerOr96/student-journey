import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Введите email и пароль'); return; }
    setLoading(true);
    try {
      let loginInput = email.trim();
      if (!loginInput.includes('@')) {
        loginInput = `${loginInput}@stud.ulsu.ru`;
      }
      const user = await login(loginInput, password);
      if (user?.role === 'admin') {
        router.replace('/(admin)/dashboard' as any);
      } else if (user?.appRole === 'student') {
        router.replace('/(app)/(student)/home');
      } else {
        router.replace('/(app)/(applicant)/home');
      }
    } catch (e: any) {
      setError(e.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>OH</Text>
          </View>
          <Text style={styles.title}>Okuw Hemrasy</Text>
          <Text style={styles.subtitle}>УлГУ — Путь к образованию</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Вход</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Input
            label="Логин (Email или ФИО)"
            value={email}
            onChangeText={setEmail}
            placeholder="Например: ivanov.ivan"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="Введите пароль"
            secureTextEntry
            containerStyle={styles.inputGap}
          />

          <Button onPress={handleLogin} loading={loading} fullWidth style={styles.loginBtn}>
            Войти
          </Button>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              <Text style={styles.registerTextBold}>Подать документы (Для абитуриентов)</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#991b1b', fontSize: 14 },
  inputGap: { marginTop: 14 },
  loginBtn: { marginTop: 22 },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#64748b' },
  registerTextBold: { color: '#0ea5e9', fontWeight: '600' },
});
