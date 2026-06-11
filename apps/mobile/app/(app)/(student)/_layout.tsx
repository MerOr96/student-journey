import { Tabs } from 'expo-router';
import { Text, DeviceEventEmitter } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function StudentTabsLayout() {
  const { t, lang } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (res.success && res.data) {
          setUnreadCount((res.data as any).count);
        }
      } catch (e) {}
    };
    fetchCount();
    
    const interval = setInterval(fetchCount, 30000);
    
    const sub = DeviceEventEmitter.addListener('messagesRead', () => {
      setUnreadCount(0);
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

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
      <Tabs.Screen
        name="documents"
        options={{
          title: t('actionDocuments'),
          tabBarIcon: ({ focused }) => <Icon emoji="📄" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="certificates"
        options={{
          title: t('tabCertificates'),
          tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: lang === 'ru' ? 'Сообщения' : 'Hatlar',
          tabBarIcon: ({ focused }) => <Icon emoji="💬" focused={focused} />,
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
    </Tabs>
  );
}
