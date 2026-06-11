import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { GameProvider } from '@/lib/game-context';
import {
  registerPushToken,
  addNotificationResponseListener,
} from '@/lib/notifications';

function NotificationHandler() {
  const { user } = useAuth();
  const responseListenerCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    // Регистрируем FCM токен когда пользователь авторизован
    registerPushToken().catch(() => {}); // ошибки не критичны

    // Слушаем нажатия на уведомления (приложение было в фоне/закрыто)
    responseListenerCleanup.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      const screen = data?.screen;

      const roleFolder = user.appRole === 'student' ? '(student)' : '(applicant)';

      if (screen === 'messages' || screen === 'chat') {
        router.push(`/(app)/${roleFolder}/messages` as any);
      } else if (screen === 'certificates') {
        router.push(`/(app)/${roleFolder}/certificates` as any);
      } else if (screen === 'documents') {
        router.push(`/(app)/${roleFolder}/documents` as any);
      }
    });

    return () => {
      responseListenerCleanup.current?.();
    };
  }, [user]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GameProvider>
        <NotificationHandler />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </GameProvider>
    </AuthProvider>
  );
}
