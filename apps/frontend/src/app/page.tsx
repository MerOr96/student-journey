'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Map,
  Trophy,
  BrainCircuit,
  Users,
  Building2,
  CheckCircle,
  Globe,
  BookOpen,
  MapPin,
  Plane,
  Home,
  Utensils,
  Award,
  Shield,
  Heart,
  Star,
  Landmark,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Language } from '@student-journey/shared';

const content = {
  ru: {
    heroTitle: 'Твой путь к образованию в России',
    heroSubtitle:
      'Okuw Hemrasy — платформа, которая поможет тебе поступить в Ульяновский государственный университет. Проходи квесты, собирай награды и готовь документы шаг за шагом.',
    cta: 'Начать путешествие',
    login: 'Войти',
    features: [
      {
        icon: Trophy,
        title: 'Система квестов',
        description:
          'Пошагово выполняй задания и получай XP за каждый шаг на пути к поступлению',
      },
      {
        icon: BrainCircuit,
        title: 'Карьерный тест',
        description:
          'Пройди тест и узнай, какой факультет подходит тебе лучше всего',
      },
      {
        icon: Map,
        title: 'Карта кампуса',
        description:
          'Изучи университет заранее: корпуса, общежития, столовые и спортзалы',
      },
    ],
    stats: [
      { value: '13000+', label: 'студентов' },
      { value: '8', label: 'факультетов' },
      { value: '95%', label: 'поступление' },
    ],
    universityTitle: 'Ульяновский государственный университет',
    universitySubtitle: 'УлГУ — один из ведущих классических университетов Поволжья',
    universityPoints: [
      {
        icon: BookOpen,
        title: 'Более 100 направлений',
        description: 'Широкий выбор программ бакалавриата, магистратуры и аспирантуры в области инженерии, IT, экономики и гуманитарных наук.',
      },
      {
        icon: Award,
        title: 'Аккредитация и признание',
        description: 'Государственная аккредитация, дипломы признаются во всём мире. Университет входит в число лучших классических вузов России.',
      },
      {
        icon: Users,
        title: 'Международное сообщество',
        description: 'Более 1500 иностранных студентов из 40+ стран мира. Развитая система адаптации и поддержки.',
      },
      {
        icon: Shield,
        title: 'Доступное образование',
        description: 'Конкурентоспособная стоимость обучения по сравнению с вузами Москвы и Санкт-Петербурга при высоком качестве образования.',
      },
    ],
    cityTitle: 'Ульяновск — город на Волге',
    citySubtitle: 'Комфортный и безопасный город для учёбы и жизни',
    cityPoints: [
      {
        icon: MapPin,
        title: 'Расположение',
        description: 'Ульяновск расположен на берегу Волги — одной из великих рек Европы. Город с населением более 600 000 человек и богатой историей.',
      },
      {
        icon: Plane,
        title: 'Удобная логистика',
        description: 'Международный аэропорт с прямыми рейсами. Удобное железнодорожное сообщение с Москвой, Казанью и другими городами.',
      },
      {
        icon: Home,
        title: 'Доступная жизнь',
        description: 'Стоимость жизни значительно ниже, чем в столичных городах. Комфортные общежития, недорогое жильё и транспорт.',
      },
      {
        icon: Utensils,
        title: 'Быт и инфраструктура',
        description: 'Развитая городская инфраструктура: торговые центры, кафе, парки, спортивные комплексы, театры и музеи.',
      },
    ],
    whyUsTitle: 'Почему стоит выбрать нас?',
    whyUsSubtitle: 'Мы сопровождаем тебя на каждом этапе поступления',
    whyUsPoints: [
      {
        icon: Heart,
        title: 'Полная поддержка',
        description: 'Мы помогаем с подготовкой документов, переводами, оформлением визы и приглашения. Ты не останешься один на один с бюрократией.',
      },
      {
        icon: Star,
        title: 'Подготовительный факультет',
        description: 'Для тех, кто хочет подтянуть русский язык — есть подготовительное отделение с интенсивными курсами.',
      },
      {
        icon: Building2,
        title: 'Гарантия общежития',
        description: 'Всем иностранным студентам предоставляется место в комфортном общежитии на территории кампуса.',
      },
      {
        icon: Landmark,
        title: 'Трудоустройство и карьера',
        description: 'Партнёрство с крупными компаниями, стажировки и программы трудоустройства для выпускников.',
      },
    ],
  },
  tk: {
    heroTitle: 'Russiýada bilim almak ýoluň',
    heroSubtitle:
      'Okuw Hemrasy — Ulýanowsk döwlet uniwersitetine girmäge kömek edýän platforma. Kwestleri ýerine ýetir, baýraklary ýygna we resminamalaryňy ädimme-ädim taýýarla.',
    cta: 'Syyahaty başla',
    login: 'Girmek',
    features: [
      {
        icon: Trophy,
        title: 'Kwest ulgamy',
        description:
          'Ädimme-ädim wezipeleri ýerine ýetir we her ädim üçin XP gazan',
      },
      {
        icon: BrainCircuit,
        title: 'Hünär testi',
        description:
          'Testi geç we haýsy fakultetiň (ugryň) saňa laýykdygyny bil',
      },
      {
        icon: Map,
        title: 'Kampus kartasy',
        description:
          'Uniwersiteti öňünden öwren: binalar, umumy ýaşaýyş jaýy, naharhana we sport zallary',
      },
    ],
    stats: [
      { value: '1000+', label: 'talyplar' },
      { value: '8', label: 'fakultet' },
      { value: '95%', label: 'kabul ediliş' },
    ],
    universityTitle: 'Ulýanowsk döwlet uniwersiteti',
    universitySubtitle: 'UlDU — Powolžýanyň öňdebaryjy klassiki uniwersitetleriniň biri',
    universityPoints: [
      {
        icon: BookOpen,
        title: '100-den gowrak ugur',
        description: 'Inženerçilik, IT, ykdysadyýet we ynsanperwer ylymlary boýunça bakalawr, magistratura we aspirantura maksatnamalarynyň giň saýlawy.',
      },
      {
        icon: Award,
        title: 'Akkreditasiýa we ykrar etme',
        description: 'Döwlet akkreditasiýasy, diplomlar dünýäde ykrar edilýär. Uniwersitet Russiýanyň iň gowy klassiki ýokary okuw jaýlarynyň hataryna girýär.',
      },
      {
        icon: Users,
        title: 'Halkara jemgyýeti',
        description: '40+ ýurtdan 1500-den gowrak daşary ýurtly talyplar. Uýgunlaşma we goldaw ulgamy bar.',
      },
      {
        icon: Shield,
        title: 'Elýeterli bilim',
        description: 'Moskwa we Sankt-Peterburg ýokary okuw jaýlary bilen deňeşdirilende bäsdeşlik bahasy we ýokary hilli bilim.',
      },
    ],
    cityTitle: 'Ulýanowsk — Wolga derýasynyň kenaryndaky şäher',
    citySubtitle: 'Okamak we ýaşamak üçin amatly we howpsuz şäher',
    cityPoints: [
      {
        icon: MapPin,
        title: 'Ýerleşişi',
        description: 'Ulýanowsk Ýewropanyň iň uly derýalarynyň biri bolan Wolganyň kenarynda ýerleşýär. 600 000-den gowrak ilaty bolan baý taryhly şäher.',
      },
      {
        icon: Plane,
        title: 'Amatly logistika',
        description: 'Göni gatnawly halkara aeroporty. Moskwa, Kazan we beýleki şäherler bilen amatly demir ýol gatnawy.',
      },
      {
        icon: Home,
        title: 'Elýeterli ýaşaýyş',
        description: 'Ýaşaýyş bahasy paýtagt şäherlerden ep-esli arzan. Amatly umumy ýaşaýyş jaýlary, arzan jaý we transport.',
      },
      {
        icon: Utensils,
        title: 'Durmuş we infrastruktura',
        description: 'Ösen şäher infrastrukturasy: söwda merkezleri, kafeleri, seýilgähler, sport toplumlary, teatrlar we muzeýler.',
      },
    ],
    whyUsTitle: 'Bizi näme üçin saýlamaly?',
    whyUsSubtitle: 'Okuwa girmegiň her tapgyrynda seniň ýanyňda',
    whyUsPoints: [
      {
        icon: Heart,
        title: 'Doly goldaw',
        description: 'Resminamalary taýýarlamakda, terjime etmekde, wiza we çakylyk resmileşdirmekde kömek edýäris. Býurokratiýa bilen ýeke galmarsynyň.',
      },
      {
        icon: Star,
        title: 'Taýýarlyk fakulteti',
        description: 'Rus dilini öwrenmek isleýänler üçin — güýçlendirilen kurslar bilen taýýarlyk bölümi bar.',
      },
      {
        icon: Building2,
        title: 'Umumy ýaşaýyş jaýy kepilligi',
        description: 'Ähli daşary ýurtly talyplara kampus çäginde amatly umumy ýaşaýyş jaýynda ýer berilýär.',
      },
      {
        icon: Landmark,
        title: 'Iş we karýera',
        description: 'Iri kompaniýalar bilen hyzmatdaşlyk, tejribelik we uçurymlar üçin iş bilen üpjün etmek maksatnamalary.',
      },
    ],
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('ru');
  const t = content[lang];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="absolute right-4 top-4 z-50">
        <div className="flex items-center gap-1 rounded-full bg-white/20 p-1 backdrop-blur-sm">
          <button
            onClick={() => setLang('ru')}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${lang === 'ru'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-white hover:bg-white/10'
              }`}
          >
            <Globe className="h-3.5 w-3.5" />
            RU
          </button>
          <button
            onClick={() => setLang('tk')}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${lang === 'tk'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-white hover:bg-white/10'
              }`}
          >
            <Globe className="h-3.5 w-3.5" />
            TK
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden px-4 pb-20 pt-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-10 right-10 h-96 w-96 rounded-full bg-secondary-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <GraduationCap className="h-12 w-12" />
          </div>

          <p className="mb-3 text-lg font-medium text-blue-200 tracking-wide uppercase">
            Okuw Hemrasy
          </p>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t.heroTitle}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100 sm:text-xl">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-base font-semibold">
                {t.cta}
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                {t.login}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8">
          {t.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-blue-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* University Section */}
      <section className="px-4 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.universityTitle}
            </h2>
            <p className="mt-3 text-lg text-gray-500">{t.universitySubtitle}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {t.universityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{point.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{point.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* City Section */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.cityTitle}
            </h2>
            <p className="mt-3 text-lg text-gray-500">{t.citySubtitle}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {t.cityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-100">
                    <Icon className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{point.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{point.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="px-4 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {t.whyUsTitle}
            </h2>
            <p className="mt-3 text-lg text-gray-500">{t.whyUsSubtitle}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {t.whyUsPoints.map((point) => {
              const Icon = point.icon;
              return (
                <Card key={point.title} hover padding="lg">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-100">
                      <Icon className="h-6 w-6 text-accent-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{point.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{point.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {lang === 'ru' ? 'Как работает платформа' : 'Platforma nähili işleýär'}
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              {lang === 'ru'
                ? 'Простой и удобный процесс поступления'
                : 'Ýönekeý we amatly okuwa giriş prosesi'}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {t.features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} hover padding="lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA Section */}
      <section className="gradient-hero px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Users className="h-8 w-8" />
            <Building2 className="h-8 w-8" />
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            {lang === 'ru'
              ? 'Присоединяйся к сотням студентов из Туркменистана'
              : 'Türkmenistanly ýüzlerçe talyba goşul'}
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            {lang === 'ru'
              ? 'Сотни студентов уже начали свой путь к образованию в России через нашу платформу. Начни и ты!'
              : 'Ýüzlerçe talyplar eýýäm biziň platformamyz arkaly Russiýada bilim almak ýoluna başlady. Sen hem başla!'}
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base font-semibold">
              {t.cta}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-4xl text-center text-sm text-gray-500">
          &copy; 2024 Okuw Hemrasy.{' '}
          {lang === 'ru' ? 'Все права защищены.' : 'Ähli hukuklar goralan.'}
        </div>
      </footer>
    </div>
  );
}
