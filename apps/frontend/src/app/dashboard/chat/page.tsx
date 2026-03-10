'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { api } from '@/lib/api';
import type { Language } from '@student-journey/shared';
import { Button } from '@/components/ui/Button';
import { Send, Bot, User } from 'lucide-react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user, language } = useAuth();
  const { completeQuest } = useGame();
  const lang = (language || 'ru') as Language;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = {
    title: lang === 'tk' ? 'AI Kömekçi' : 'AI Помощник',
    subtitle: lang === 'tk' ? 'Okuwa girmek barada islendik sorag ber' : 'Задай любой вопрос о поступлении',
    placeholder: lang === 'tk' ? 'Sorag ýaz...' : 'Напиши вопрос...',
    welcome: lang === 'tk'
      ? 'Salam! Men AI kömekçi. UlGU-a okuwa girmek barada islendik sorag berip bilersiňiz.'
      : 'Привет! Я AI-помощник. Задавайте любые вопросы о поступлении в УлГУ.',
    send: lang === 'tk' ? 'Iber' : 'Отправить',
  };

  useEffect(() => {
    api.get('/chat').then((res: any) => {
      setMessages(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempUserMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setSending(true);
    setTyping(true);

    try {
      const res: any = await api.post('/chat', { content: text });
      setTyping(false);
      if (res.data) {
        // Replace temp message and add assistant response
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...without, res.data.userMessage, res.data.assistantMessage];
        });
      }
      await completeQuest('chat_with_advisor');
    } catch (e) {
      setTyping(false);
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-transition flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 scrollbar-thin">
        {messages.length === 0 && !typing && (
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-700 max-w-[80%]">
              {t.welcome}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-100 text-primary-600'
              }`}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-primary-600 text-white'
                  : 'rounded-tl-sm bg-gray-100 text-gray-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {typing && (
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          disabled={sending}
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          loading={sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
