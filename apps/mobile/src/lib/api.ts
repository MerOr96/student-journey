import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '@student-journey/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
const TIMEOUT_MS = 12000; // 12 секунд

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('accessToken');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    // Promise.race — не используем AbortController (не работает с whatwg-fetch в RN)
    const res = await Promise.race([
      fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS),
      ),
    ]);

    const json = await res.json();

    if (res.status === 401) {
      if (path === '/auth/refresh' || path === '/auth/login') {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return json;
      }

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          
          if (refreshRes.ok) {
            const refreshJson = await refreshRes.json();
            if (refreshJson.success && refreshJson.data?.accessToken) {
              const newAccessToken = refreshJson.data.accessToken;
              await AsyncStorage.setItem('accessToken', newAccessToken);
              
              // Повторяем оригинальный запрос с новым токеном
              headers['Authorization'] = `Bearer ${newAccessToken}`;
              const retryRes = await fetch(`${BASE_URL}${path}`, {
                method,
                headers,
                body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
              });
              return await retryRes.json();
            }
          }
        } catch (e) {
          console.error('[api] Token refresh failed:', e);
        }
      }

      // Если обновить не получилось или нет рефреш-токена
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }

    return json;
  } catch (err: any) {
    const isTimeout = err?.message === 'TIMEOUT';
    return {
      success: false,
      data: null,
      message: isTimeout ? 'Превышено время ожидания' : 'Нет соединения с сервером',
    } as ApiResponse<T>;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
