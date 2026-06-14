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
