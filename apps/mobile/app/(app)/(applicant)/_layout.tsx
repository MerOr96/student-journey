import { Tabs, Redirect } from 'expo-router';
import { Text, DeviceEventEmitter } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function ApplicantTabsLayout() {
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Ограничение доступа: если это студент, редиректим в студенческую зону
  if (user?.appRole === 'student') {
    return <Redirect href="/(app)/(student)/home" />;
  }

  const isAccepted = user?.applicationStatus === 'ACCEPTED';

  useEffect(() => {
    if (isAccepted) {
      const fetchCount = async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          if (res.success && res.data) {
            setUnreadCount((res.data as any).count);
          }
        } catch (e) {}
      };
      fetchCount();
      
      const interval = setInterval(fetchCount, 30000); // Poll every 30s just in case
      
      const sub = DeviceEventEmitter.addListener('messagesRead', () => {
        setUnreadCount(0);
      });

      return () => {
        clearInterval(interval);
        sub.remove();
      };
    }
  }, [isAccepted]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
        }}
      />
      
      {/* Квесты и Факультеты показываем ТОЛЬКО ДО ACCEPTED */}
      <Tabs.Screen
        name="quests"
        options={{
          title: t('actionQuests'),
          tabBarIcon: ({ focused }) => <Icon emoji="⚡" focused={focused} />,
          href: isAccepted ? null : undefined, // Скрываем из меню, если ACCEPTED
        }}
      />
      <Tabs.Screen
        name="faculties"
        options={{
          title: t('actionFaculties'),
          tabBarIcon: ({ focused }) => <Icon emoji="🎓" focused={focused} />,
          href: isAccepted ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="documents"
        options={{
          title: lang === 'ru' ? 'Документы' : 'Resminamalar',
          tabBarIcon: ({ focused }) => <Icon emoji="📄" focused={focused} />,
        }}
      />

      {/* Экзамены и Сообщения показываем ТОЛЬКО КОГДА ACCEPTED */}
      <Tabs.Screen
        name="exams"
        options={{
          title: lang === 'ru' ? 'Экзамены' : 'Synaglar',
          tabBarIcon: ({ focused }) => <Icon emoji="📝" focused={focused} />,
          href: isAccepted ? undefined : null, // Показываем только если ACCEPTED
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: lang === 'ru' ? 'Сообщения' : 'Hatlar',
          tabBarIcon: ({ focused }) => <Icon emoji="💬" focused={focused} />,
          href: isAccepted ? undefined : null,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 10 },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('actionProfile'),
          tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
        }}
      />

      {/* Скрытые экраны — доступны через router.push, но не в таббаре */}
      <Tabs.Screen name="career-quiz" options={{ href: null }} />

      <Tabs.Screen name="advisor-chat" options={{ href: null }} />
      <Tabs.Screen name="invite-friend" options={{ href: null }} />
    </Tabs>
  );
}
