import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { user, loading, networkError, retryAuth } = useAuth();
  const rootNavState = useRootNavigationState();
  const [dots, setDots] = useState('');

  // Анимация точек пока загружаемся
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    // Ждём пока Expo Router полностью инициализирует навигацию
    if (!rootNavState?.key) return;
    if (loading) return;

    if (networkError) {
      router.replace('/(auth)/login');
      return;
    }
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user?.appRole === 'student') {
      router.replace('/(app)/(student)/home');
    } else {
      router.replace('/(app)/(applicant)/home');
    }
  }, [user, loading, networkError, rootNavState?.key]);

  if (networkError) {
    return (
      <View style={styles.root}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>Нет соединения</Text>
        <Text style={styles.subtitle}>
          Не удалось подключиться к серверу.{'\n'}
          Проверь WiFi и попробуй снова.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={retryAuth}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>SJ</Text>
      </View>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 24 }} />
      <Text style={styles.loadingText}>Загрузка{dots}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0ea5e9', padding: 32 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  loadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 16 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  retryBtn: {
    backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: { color: '#0ea5e9', fontWeight: '700', fontSize: 16 },
});
