import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Share, TouchableOpacity, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { generateReferralCode } from '@student-journey/shared';

export default function InviteFriendScreen() {
  const { user } = useAuth();
  const { profile, completeQuest } = useGame();
  const lang = (user?.language || 'ru') as 'ru' | 'tk';

  const referralCode = user ? generateReferralCode(user.id) : 'ULG-XXXXXXXX';
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [questDone, setQuestDone] = useState(
    profile?.completedQuests.includes('invite_friend') ?? false,
  );

  const shareText = lang === 'ru'
    ? `Привет! Я поступаю в УлГУ — Ульяновский государственный университет 🎓\n\nПомогут с поступлением: приложение Okuw Hemrasy\nМой код приглашения: ${referralCode}\n\nСкачай и введи мой код при регистрации!`
    : `Salam! Men UlGU-a - Ulýanowsk Döwlet Uniwersitetine girýärin 🎓\n\nGirmäge kömek eder: Okuw Hemrasy programmasy\nMeniň çakylyk kodum: ${referralCode}\n\nYndyr we hasaba duranyňda meniň kodumu giriziň!`;

  const handleShare = async () => {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        setShared(true);
        if (!questDone) {
          const res = await completeQuest('invite_friend');
          if (res) setQuestDone(true);
        }
      }
    } catch (e) {
      // Пользователь отменил
    }
  };

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const benefits = lang === 'ru'
    ? [
        { emoji: '🎁', title: 'Ты получаешь', desc: '+80 XP за приглашение' },
        { emoji: '📲', title: 'Твой друг получает', desc: 'Готовый гид по поступлению' },
        { emoji: '🤝', title: 'Вместе проще', desc: 'Помогайте друг другу с документами' },
      ]
    : [
        { emoji: '🎁', title: 'Sen alýarsyň', desc: 'Çakylyk üçin +80 XP' },
        { emoji: '📲', title: 'Dostuň alýar', desc: 'Okuwa girmek üçin taýýar gollanma' },
        { emoji: '🤝', title: 'Bilelikde aňsat', desc: 'Resminamalar üçin biri-birine kömek ediň' },
      ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← {lang === 'ru' ? 'Назад' : 'Yza'}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🦋</Text>
          <Text style={styles.heroTitle}>
            {lang === 'ru' ? 'Пригласи друга' : 'Dostuňy çagyr'}
          </Text>
          <Text style={styles.heroSub}>
            {lang === 'ru'
              ? 'Поделись кодом с другом из Туркменистана, который тоже хочет учиться в России'
              : 'Orsýetde okamagy isleýän Türkmenistanly dostuňyz bilen paýlaşyň'}
          </Text>
        </View>

        {/* Преимущества */}
        <View style={styles.benefitsRow}>
          {benefits.map((b, i) => (
            <Card key={i} style={styles.benefitCard}>
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </Card>
          ))}
        </View>

        {/* Реферальный код */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>
            {lang === 'ru' ? 'Твой код приглашения' : 'Çakylyk koduňyz'}
          </Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={handleCopy}
            >
              <Text style={styles.copyBtnText}>
                {copied
                  ? (lang === 'ru' ? '✓ Скопировано' : '✓ Göçürildi')
                  : (lang === 'ru' ? 'Копировать' : 'Göçür')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            {lang === 'ru'
              ? 'Друг вводит этот код при регистрации в приложении'
              : 'Dostup programma hasaba duranyňda bu kody girizýär'}
          </Text>
        </Card>

        {/* Поделиться */}
        <Button
          onPress={handleShare}
          style={styles.shareBtn}
        >
          {lang === 'ru' ? '📤 Поделиться с другом' : '📤 Dostum bilen paýlaş'}
        </Button>

        {/* Статус */}
        {(shared || questDone) && (
          <Card style={styles.xpCard}>
            <Text style={styles.xpEmoji}>🎉</Text>
            <Text style={styles.xpTitle}>
              {lang === 'ru' ? 'Поделился!' : 'Paýlaşyldy!'}
            </Text>
            <Text style={styles.xpSub}>
              {lang === 'ru' ? '+80 XP добавлено к профилю' : 'Profiliňize +80 XP goşuldy'}
            </Text>
          </Card>
        )}

        {/* Предпросмотр текста */}
        <Card style={styles.previewCard}>
          <Text style={styles.previewLabel}>
            {lang === 'ru' ? 'Что увидит друг:' : 'Dostuňyz nämäni görer:'}
          </Text>
          <Text style={styles.previewText}>{shareText}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },

  backBtn: { marginBottom: 4 },
  backText: { color: '#0ea5e9', fontSize: 15, fontWeight: '600' },

  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  heroEmoji: { fontSize: 60 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  heroSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  benefitsRow: { flexDirection: 'row', gap: 8 },
  benefitCard: { flex: 1, alignItems: 'center', gap: 4, padding: 12 },
  benefitEmoji: { fontSize: 28 },
  benefitTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  benefitDesc: { fontSize: 11, color: '#0f172a', textAlign: 'center', lineHeight: 16 },

  codeCard: { gap: 10 },
  codeLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeText: {
    flex: 1, fontSize: 22, fontWeight: '800', color: '#0369a1',
    letterSpacing: 2, fontFamily: 'monospace',
  },
  copyBtn: {
    borderRadius: 8, borderWidth: 1.5, borderColor: '#0ea5e9',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  copyBtnDone: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: '#0369a1' },
  codeHint: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },

  shareBtn: {},

  xpCard: {
    backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#86efac',
    alignItems: 'center', gap: 4,
  },
  xpEmoji: { fontSize: 36 },
  xpTitle: { fontSize: 18, fontWeight: '800', color: '#15803d' },
  xpSub: { fontSize: 14, color: '#16a34a' },

  previewCard: { backgroundColor: '#f8fafc' },
  previewLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  previewText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
