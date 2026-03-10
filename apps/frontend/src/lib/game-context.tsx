'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { PlayerProfile } from '@student-journey/shared';
import api from './api';
import { useAuth } from './auth-context';

interface GameContextValue {
  profile: PlayerProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  completeQuest: (slug: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const ADMIN_DEFAULT_PROFILE: PlayerProfile = {
  userId: '',
  xp: 0,
  level: 'beginner',
  completedQuests: [],
  badges: [],
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAdmin } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    if (isAdmin) {
      setProfile({ ...ADMIN_DEFAULT_PROFILE, userId: user?.id || '' });
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<{ data: PlayerProfile }>('/profile');
      setProfile(data.data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, user?.id]);

  useEffect(() => {
    if (user && token) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [user, token, refreshProfile]);

  const completeQuest = useCallback(
    async (slug: string) => {
      await api.post(`/quests/${slug}/complete`);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      profile,
      loading,
      refreshProfile,
      completeQuest,
    }),
    [profile, loading, refreshProfile, completeQuest],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
