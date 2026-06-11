import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FAQ {
  q: { ru: string; tk: string };
  a: { ru: string; tk: string };
}

const FAQS: FAQ[] = [
  {
    q: { ru: 'Какие документы нужны для поступления?', tk: 'Okuwa girmek üçin haýsy resminamalar gerek?' },
    a: {
      ru: 'Для поступления потребуются: паспорт (оригинал + копия), аттестат о среднем образовании с нотариально заверенным переводом, фото 3×4 (6 штук), медицинская справка, страховой полис и миграционная карта.',
      tk: 'Okuwa girmek üçin: pasport (asyl + göçürme), notarial tassyklanan terjimesi bilen orta bilim şahadatnamasy, 3×4 surat (6 sany), lukmançylyk kepilnamasy, ätiýaçlandyryş polisi we migrasiýa kartasy gerek.',
    },
  },
  {
    q: { ru: 'Как получить студенческую визу в Россию?', tk: 'Orsýete talyp wizasyny nädip almaly?' },
    a: {
      ru: 'После зачисления университет отправит вам оригинал приглашения. С ним нужно обратиться в Посольство России в Туркменистане. Срок оформления — около 30 дней. Перечень документов уточните у нашего менеджера.',
      tk: 'Kabul edilenden soň, uniwersitet size çakylyk asylyny iberýär. Onuň bilen Türkmenistandaky Orsýet Ilçihanasyna ýüz tutmaly. Resmileşdirme möhleti — takmynan 30 gün. Resminama sanawy üçin menejerimize ýüz tutuň.',
    },
  },
  {
    q: { ru: 'Есть ли общежитие для иностранных студентов?', tk: 'Daşary ýurt talyplary üçin ýatakhana barmy?' },
    a: {
      ru: 'Да, УлГУ предоставляет общежитие иностранным студентам. Стоимость около 15 000 ₽ в год. Заявление на заселение подаётся после зачисления. Рекомендуем подавать заявку заранее — мест ограниченное количество.',
      tk: 'Hawa, UlGU daşary ýurt talyplary üçin ýatakhana berýär. Bahasy ýylda takmynan 15 000 ₽. Ýerleşmek üçin arza kabul edilenden soň berilýär. Öňünden arza bermegi maslahat berýäris — orun sany çäkli.',
    },
  },
  {
    q: { ru: 'Сколько стоит обучение?', tk: 'Okuwyň bahasy näçe?' },
    a: {
      ru: 'Стоимость обучения зависит от выбранной специальности и составляет от 80 000 до 250 000 ₽ в год. Медицинские специальности — самые дорогостоящие. Воспользуйтесь нашим калькулятором бюджета для точного расчёта.',
      tk: 'Okuw tölegi saýlanan hünäre baglylykda ýylda 80 000-den 250 000 ₽-a çenli. Lukmançylyk hünärleri iň gymmat. Takyk hasaplama üçin biziň býujet kalkulýatorymyzdan peýdalanyň.',
    },
  },
  {
    q: { ru: 'Как перевестись из студента-абитуриента в студента?', tk: 'Dalaşgärden talyba nädip geçmeli?' },
    a: {
      ru: 'После рассмотрения документов университетом и официального зачисления администратор изменит ваш статус. Вы получите уведомление в приложении, и интерфейс автоматически переключится на студенческий раздел.',
      tk: 'Resminamalaryň uniwersitet tarapyndan seredilenden we resmi kabul edilenden soň, administrator statusyňyzy üýtgeder. Programma bildiriş alarsyňyz we interfeýs awtomatiki talyp bölümine geçer.',
    },
  },
  {
    q: { ru: 'Принимаете ли вы студентов из всех велаятов Туркменистана?', tk: 'Türkmenistanyň ähli welaýatlaryndan talyp kabul edýärsiňizmi?' },
    a: {
      ru: 'Да, мы принимаем абитуриентов из всех регионов Туркменистана: Ахалского, Балканского, Дашогузского, Лебапского, Марыйского велаятов и Ашхабада.',
      tk: 'Hawa, Türkmenistanyň ähli sebitlerinden: Ahal, Balkan, Daşoguz, Lebap, Mary welaýatlaryndan we Aşgabatdan dalaşgärleri kabul edýäris.',
    },
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function AdvisorChatScreen() {
  const { user } = useAuth();
  const { profile, completeQuest } = useGame();
  const lang = (user?.language || 'ru') as 'ru' | 'tk';
  const scrollRef = useRef<ScrollView>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: lang === 'ru'
        ? 'Здравствуй! Я помощник приёмной комиссии УлГУ. Ниже — частые вопросы. Если не нашёл ответ — напиши мне!'
        : 'Salam! Men UlGU kabul ediş toparynyň kömekçisi. Aşakda ýygy soraglar bar. Jogap tapmasaňyz — maňa ýazyň!',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [questDone, setQuestDone] = useState(
    profile?.completedQuests.includes('chat_with_advisor') ?? false,
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setSending(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Небольшая задержка — имитация ответа
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: lang === 'ru'
          ? 'Спасибо за вопрос! Ваше сообщение получено. Менеджер приёмной комиссии ответит вам в ближайшее время через email или мессенджер.'
          : 'Sorawyňyz üçin sag boluň! Hatyňyz alyndy. Kabul ediş toparynyň mennejeri size email ýa-da messenger arkaly ýakyn wagtda jogap berer.',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
      setSending(false);
      scrollRef.current?.scrollToEnd({ animated: true });

      // Выполняем квест при первом сообщении
      if (!questDone) {
        completeQuest('chat_with_advisor').then((res) => {
          if (res) setQuestDone(true);
        });
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {lang === 'ru' ? 'Помощник приёмной комиссии' : 'Kabul ediş kömekçisi'}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
          <Text style={styles.headerEmoji}>🎓</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* FAQ секция */}
          <View style={styles.faqBlock}>
            <Text style={styles.faqTitle}>
              {lang === 'ru' ? '📋 Частые вопросы' : '📋 Ýygy soraglar'}
            </Text>
            {FAQS.map((faq, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.faqItem, openFaq === i && styles.faqItemOpen]}
                activeOpacity={0.8}
                onPress={() => {
                  setOpenFaq(openFaq === i ? null : i);
                  if (!questDone) {
                    completeQuest('chat_with_advisor').then((res) => {
                      if (res) setQuestDone(true);
                    });
                  }
                }}
              >
                <View style={styles.faqRow}>
                  <Text style={styles.faqQ}>{faq.q[lang]}</Text>
                  <Text style={styles.faqChevron}>{openFaq === i ? '▲' : '▼'}</Text>
                </View>
                {openFaq === i && (
                  <Text style={styles.faqA}>{faq.a[lang]}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Сообщения */}
          <Text style={styles.chatDivider}>
            {lang === 'ru' ? '— Личный вопрос —' : '— Şahsy sorag —'}
          </Text>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}
            >
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                {msg.text}
              </Text>
              <Text style={[styles.bubbleTime, msg.role === 'user' && styles.bubbleTimeUser]}>
                {msg.time}
              </Text>
            </View>
          ))}
          {sending && (
            <View style={styles.bubbleBot}>
              <ActivityIndicator color="#0ea5e9" size="small" />
            </View>
          )}
          {questDone && (
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>
                🤖 {lang === 'ru' ? 'Квест выполнен! +30 XP' : 'Quest ýerine ýetirildi! +30 XP'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={lang === 'ru' ? 'Напишите вопрос...' : 'Sorag ýazyň...'}
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backText: { fontSize: 22, color: '#0ea5e9', fontWeight: '700' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  headerEmoji: { fontSize: 28 },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 8 },

  faqBlock: { gap: 8, marginBottom: 8 },
  faqTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  faqItem: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#e2e8f0', padding: 12, gap: 8,
  },
  faqItemOpen: { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  faqRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', lineHeight: 20 },
  faqChevron: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  faqA: { fontSize: 13, color: '#475569', lineHeight: 20 },

  chatDivider: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginVertical: 8 },

  bubble: {
    maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14,
    paddingVertical: 10, gap: 4,
  },
  bubbleBot: {
    alignSelf: 'flex-start', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
    minWidth: 40, alignItems: 'center', justifyContent: 'center',
  },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#94a3b8', alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },

  xpBadge: {
    alignSelf: 'center', backgroundColor: '#f0fdf4',
    borderRadius: 20, borderWidth: 1, borderColor: '#86efac',
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 8,
  },
  xpBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#0f172a', maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#94a3b8' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
});
