'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { User, Language, AuthPayload, RegisterDto } from '@student-journey/shared';
import api from './api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>('ru');

  const isAdmin = user?.role === 'admin';

  const persistToken = useCallback((newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  }, []);

  const hydrateUser = useCallback(async () => {
    try {
      const data = await api.get<{ data: User }>('/auth/me');
      setUser(data.data);
      if (data.data.language) {
        setLanguageState(data.data.language);
      }
    } catch {
      persistToken(null);
      setUser(null);
    }
  }, [persistToken]);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedLang = localStorage.getItem('app_language') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
    }
    if (savedToken) {
      setToken(savedToken);
      hydrateUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hydrateUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ data: AuthPayload }>('/auth/login', {
        email,
        password,
      });
      persistToken(data.data.accessToken);
      setUser(data.data.user);
      if (data.data.user.language) {
        setLanguageState(data.data.user.language);
      }
    },
    [persistToken],
  );

  const register = useCallback(
    async (data: RegisterDto) => {
      const result = await api.post<{ data: AuthPayload }>('/auth/register', data);
      persistToken(result.data.accessToken);
      setUser(result.data.user);
      if (result.data.user.language) {
        setLanguageState(result.data.user.language);
      }
    },
    [persistToken],
  );

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
    window.location.href = '/login';
  }, [persistToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAdmin,
      language,
      setLanguage,
      login,
      register,
      logout,
    }),
    [user, token, loading, isAdmin, language, setLanguage, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
