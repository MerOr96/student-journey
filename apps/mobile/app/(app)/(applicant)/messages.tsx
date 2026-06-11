import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, DeviceEventEmitter, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { Notification } from '@student-journey/shared';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MessagesScreen() {
  const { lang } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        const data = res.data as any;
        setNotifications(data);
        // Mark all as read when opening screen (simple MVP approach)
        let hasUnread = false;
        data.forEach((n: Notification) => {
          if (!n.isRead && n.type !== 'MASS') {
            hasUnread = true;
            api.put(`/notifications/${n.id}/read`);
          }
        });

        // Notify other screens that messages are read
        if (hasUnread) {
          DeviceEventEmitter.emit('messagesRead');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <ScrollView
        style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
      }
    >
      <Text style={styles.title}>
        {lang === 'ru' ? 'Входящие сообщения' : 'Gelen hatlar'}
      </Text>

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {lang === 'ru' ? 'У вас нет новых сообщений.' : 'Täze hat ýok.'}
          </Text>
        </View>
      ) : (
        notifications.map((notif) => {
          const isExpanded = expandedIds.has(notif.id);
          const isMass = notif.type === 'MASS';
          const iconName = isMass ? 'megaphone-outline' : 'mail-outline';
          const iconColor = notif.isRead ? '#94a3b8' : '#0ea5e9';

          return (
            <TouchableOpacity
              key={notif.id}
              style={[styles.card, !notif.isRead ? styles.unreadCard : null]}
              activeOpacity={0.8}
              onPress={() => toggleExpand(notif.id)}
            >
              {/* Левая цветная полоска-индикатор для непрочитанных */}
              {!notif.isRead && <View style={styles.unreadIndicator} />}

              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: notif.isRead ? '#f1f5f9' : '#e0f2fe' }]}>
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>

                <View style={styles.headerTextContainer}>
                  <Text style={[styles.cardTitle, !notif.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(notif.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'tk-TM')}
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#94a3b8"
                  style={styles.chevron}
                />
              </View>

              <View style={styles.messageContainer}>
                <Text
                  style={[styles.messageText, !notif.isRead && styles.messageTextUnread]}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {notif.message}
                </Text>

                {!isExpanded && notif.message.length > 80 && (
                  <Text style={styles.readMoreBtn}>
                    {lang === 'ru' ? 'Читать далее' : 'Giňişleýin okamak'}
                  </Text>
                )}

                <View style={styles.tagsContainer}>
                  {isMass && (
                    <View style={styles.massBadge}>
                      <Text style={styles.massBadgeText}>{lang === 'ru' ? 'Общая рассылка' : 'Köpçülik üçin'}</Text>
                    </View>
                  )}
                  {notif.isRead && (
                    <View style={styles.readBadge}>
                      <Ionicons name="checkmark-done" size={14} color="#64748b" />
                      <Text style={styles.readBadgeText}>{lang === 'ru' ? 'Прочитано' : 'Okaldy'}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden'
  },
  unreadCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#bae6fd',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.08,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0ea5e9',
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 2 },
  cardTitleUnread: { color: '#0f172a', fontWeight: '700' },
  date: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  chevron: { marginLeft: 8 },

  messageContainer: { paddingLeft: 52 },
  messageText: { fontSize: 15, color: '#475569', lineHeight: 22 },
  messageTextUnread: { color: '#1e293b' },
  readMoreBtn: { color: '#0ea5e9', fontSize: 14, fontWeight: '600', marginTop: 6 },

  tagsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  massBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  massBadgeText: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  readBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 4 },
  readBadgeText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
});
