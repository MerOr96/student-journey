import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api } from './api';
import type { User, Language, RegisterDto } from '@student-journey/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  networkError: boolean;
  isAdmin: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  retryAuth: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [language, setLanguageState] = useState<Language>('ru');

  const initAuth = async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      const storedLang = (await AsyncStorage.getItem('language')) as Language | null;
      if (storedLang) setLanguageState(storedLang);

      if (storedToken) {
        setToken(storedToken);
        const res = await api.get<User>('/auth/me');
        console.log('[auth] /auth/me response:', JSON.stringify(res));
        if (res.success && res.data) {
          setUser(res.data);
        } else if (res.message === 'Нет соединения с сервером' || res.message === 'Превышено время ожидания') {
          // Сеть недоступна — очищаем токен и идём на логин
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setToken(null);
        } else {
          await AsyncStorage.removeItem('accessToken');
          setToken(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initAuth(); }, []);

  // Обновляет пользователя с сервера, возвращает свежие данные
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get<User>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
    } catch {}
    return null;
  }, []);

  // AppState: когда приложение выходит из фона — проверяем роль
  useEffect(() => {
    if (!user || user.appRole !== 'applicant') return;
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const updated = await refreshUser();
        if (updated?.appRole === 'student') {
          router.replace('/(app)/(student)/home');
        }
      }
    });
    return () => sub.remove();
  }, [user?.appRole, refreshUser]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
    if (token) {
      try {
        await api.put('/profile', { language: lang });
      } catch (e) {
        console.error('Failed to sync language to backend', e);
      }
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login',
      { email, password },
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Ошибка входа');
    }
    await AsyncStorage.setItem('accessToken', res.data.accessToken);
    await AsyncStorage.setItem('refreshToken', res.data.refreshToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: RegisterDto) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/register',
      data,
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Ошибка регистрации');
    }
    await AsyncStorage.setItem('accessToken', res.data.accessToken);
    await AsyncStorage.setItem('refreshToken', res.data.refreshToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        networkError,
        isAdmin: user?.role === 'admin',
        language,
        setLanguage,
        login,
        register,
        logout,
        retryAuth: initAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
