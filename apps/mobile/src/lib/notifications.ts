import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Настраиваем как показывать уведомления когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

/**
 * Запрашивает разрешение на уведомления и регистрирует FCM токен на сервере.
 * Вызывать при логине пользователя.
 */
export async function registerPushToken(): Promise<void> {
  // Работает только на реальном устройстве и не в Expo Go (в SDK 53+ Expo Go больше не поддерживает пуши)
  if (!Device.isDevice) {
    alert('[Debug] Device is not physical (Emulator)');
    return;
  }
  if (Constants.appOwnership === 'expo') {
    alert('[Debug] Running in Expo Go');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert(`[Debug] Push permission denied. Final status: ${finalStatus}`);
      return;
    }

    // Для Android нужен notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Основные',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0ea5e9',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Сообщения куратора',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0ea5e9',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('certificates', {
        name: 'Справки и документы',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#0ea5e9',
      });
    }

    // Получаем Expo Push Token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '744efc98-cf97-44ac-8ec0-fae37db7ae74';

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;

    if (!pushToken) {
      console.log('[notifications] Could not get expo push token');
      alert('Token is empty');
      return;
    }

    // Сохраняем токен на сервере
    const res = await api.post('/crm/push-token', { token: pushToken });
    console.log('[notifications] Push token registered');
    
    // ВРЕМЕННО: выводим успех и сам токен для диагностики
    alert(`Token updated: ${res.success}\n${pushToken.substring(0, 30)}...`);
  } catch (err: any) {
    console.error('[notifications] Error registering push token:', err);
    alert('Push Token Error: ' + err.message);
  }
}

/**
 * Слушатель входящих уведомлений.
 * Возвращает функцию отписки — вызывать при размонтировании компонента.
 */
export function addNotificationListener(
  onNotification: (notification: Notifications.Notification) => void,
): () => void {
  const sub = Notifications.addNotificationReceivedListener(onNotification);
  return () => sub.remove();
}

/**
 * Слушатель нажатия на уведомление (приложение было в фоне).
 */
export function addNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => sub.remove();
}
