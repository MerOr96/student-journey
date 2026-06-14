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
  if (!Device.isDevice || Constants.appOwnership === 'expo') {
    console.log('[notifications] Skipping push registration — not a real device or running in Expo Go');
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
      console.log('[notifications] Push permission denied');
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
      return;
    }

    // Сохраняем токен на сервере
    await api.post('/crm/push-token', { token: pushToken });
    console.log('[notifications] Push token registered');
  } catch (err) {
    console.error('[notifications] Error registering push token:', err);
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
