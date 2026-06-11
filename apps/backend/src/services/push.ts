/**
 * FCM Push Notification Service
 * Используем Firebase Cloud Messaging v1 HTTP API
 */

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';
const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || '';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Ссылка на экран в приложении, например "chat" | "certificates" | "documents" */
  screen?: string;
}

/**
 * Отправить push-уведомление одному пользователю по его FCM токену.
 * Использует Legacy HTTP API (простая интеграция без OAuth2).
 */
export async function sendPush(pushToken: string, payload: PushPayload): Promise<boolean> {
  if (!FCM_SERVER_KEY) {
    console.warn('[push] FCM_SERVER_KEY not set, skipping push');
    return false;
  }

  if (!pushToken) return false;

  try {
    const body = {
      to: pushToken,
      notification: {
        title: payload.title,
        body: payload.body,
        sound: 'default',
        badge: 1,
      },
      data: {
        ...(payload.data || {}),
        screen: payload.screen || '',
        title: payload.title,
        body: payload.body,
      },
      priority: 'high',
      content_available: true,
    };

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[push] FCM error:', res.status, text);
      return false;
    }

    const json = await res.json() as { success: number; failure: number };
    if (json.failure > 0) {
      console.warn('[push] FCM delivery failed for token:', pushToken);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[push] sendPush error:', err);
    return false;
  }
}

/**
 * Отправить push нескольким пользователям (batch, до 1000 токенов за раз).
 */
export async function sendPushBatch(
  tokens: string[],
  payload: PushPayload,
): Promise<void> {
  if (!FCM_SERVER_KEY || tokens.length === 0) return;

  // FCM поддерживает до 1000 registration_ids за раз
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 1000) {
    chunks.push(tokens.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    try {
      const body = {
        registration_ids: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'default',
        },
        data: {
          ...(payload.data || {}),
          screen: payload.screen || '',
        },
        priority: 'high',
        content_available: true,
      };

      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('[push] FCM batch error:', res.status);
      }
    } catch (err) {
      console.error('[push] sendPushBatch error:', err);
    }
  }
}
