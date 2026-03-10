'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Globe, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { Language } from '@student-journey/shared';
import { VELAYATS } from '@student-journey/shared';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<Language>('RU' as Language);
  const [birthDate, setBirthDate] = useState('');
  const [velayat, setVelayat] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        fullName,
        email,
        password,
        phone: phone || undefined,
        birthDate: birthDate || undefined,
        velayat: velayat || undefined,
        language,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="spinner h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md page-transition">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
            <GraduationCap className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            OkuwHemrasy
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Создайте аккаунт и начните свой путь
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <Input
              label="Полное имя"
              type="text"
              name="fullName"
              placeholder="Аман Аманов"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              icon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Пароль"
              type="password"
              name="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              icon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Телефон (привязанный к ИМО)"
              type="tel"
              name="phone"
              placeholder="+993 XX XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              icon={<Phone className="h-4 w-4" />}
            />

            {/* Language Selector */}
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Язык / Dil
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Globe className="h-4 w-4" />
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-0"
                >
                  <option value="RU">Русский</option>
                  <option value="TK">Türkmen</option>
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <Input
              label="Дата рождения"
              type="date"
              name="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              icon={<Calendar className="h-4 w-4" />}
            />

            {/* Velayat Selector */}
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Велаят / Welaýat
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <select
                  value={velayat}
                  onChange={(e) => setVelayat(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-0"
                >
                  <option value="">Выберите велаят...</option>
                  {VELAYATS.map((v) => (
                    <option key={v.slug} value={v.slug}>
                      {v.name.ru} / {v.name.tk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
