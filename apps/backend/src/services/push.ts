/**
 * Expo Push Notification Service
 */

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Ссылка на экран в приложении, например "chat" | "certificates" | "documents" */
  screen?: string;
}

/**
 * Отправить push-уведомление одному пользователю через Expo Push API
 */
export async function sendPush(pushToken: string, payload: PushPayload): Promise<boolean> {
  if (!pushToken) return false;

  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: {
        ...(payload.data || {}),
        screen: payload.screen || '',
      },
      priority: 'high',
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[push] Expo API error:', res.status, text);
      return false;
    }

    const data = await res.json() as any;
    if (data.data?.status === 'error') {
      console.warn('[push] Expo API delivery error:', data.data.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[push] sendPush error:', err);
    return false;
  }
}

/**
 * Отправить push нескольким пользователям (batch) через Expo Push API
 */
export async function sendPushBatch(
  tokens: string[],
  payload: PushPayload,
): Promise<void> {
  if (tokens.length === 0) return;

  // Expo API поддерживает отправку массива сообщений до 100 штук за раз
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const messages = chunk.map(token => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: {
          ...(payload.data || {}),
          screen: payload.screen || '',
        },
        priority: 'high',
      }));

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.error('[push] Expo batch error:', res.status);
      }
    } catch (err) {
      console.error('[push] sendPushBatch error:', err);
    }
  }
}
