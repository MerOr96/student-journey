import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './auth-context';
import type { PlayerProfile } from '@student-journey/shared';

interface GameContextType {
  profile: PlayerProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  completeQuest: (slug: string) => Promise<QuestResult | null>;
}

interface QuestResult {
  questSlug: string;
  xpAwarded: number;
  newXp: number;
  newLevel: string;
  badgeEarned: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<PlayerProfile>('/profile');
      if (res.success && res.data) setProfile(res.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') return;
    refreshProfile();
  }, [user, refreshProfile]);

  const completeQuest = async (slug: string): Promise<QuestResult | null> => {
    const res = await api.post<{ questResult: QuestResult }>(`/quests/${slug}/complete`);
    if (res.success && res.data?.questResult) {
      await refreshProfile();
      return res.data.questResult;
    }
    return null;
  };

  return (
    <GameContext.Provider value={{ profile, loading, refreshProfile, completeQuest }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
