import { useAuth } from '@/lib/auth-context';

export type TranslationKey = keyof typeof DICTIONARY;

const DICTIONARY = {
  // Common
  loading: { ru: 'Загрузка...', tk: 'Ýüklenýär...' },
  save: { ru: 'Сохранить', tk: 'Ýatda sakla' },
  cancel: { ru: 'Отмена', tk: 'Ýatyr' },
  logout: { ru: 'Выйти', tk: 'Çykmak' },

  // Home Screen
  greeting: { ru: 'Привет', tk: 'Salam' },
  journeySubtitle: { ru: 'Твой путь к поступлению', tk: 'Okuwa girmegiň ýoly' },
  studentDashboard: { ru: 'Личный кабинет студента', tk: 'Talybyň şahsy otagy' },
  maxLevel: { ru: 'Максимальный уровень 🎉', tk: 'Iň ýokary dereje 🎉' },
  xpToNextLevel: { ru: 'До "{{level}}": {{xp}} XP', tk: '"{{level}}" çenli: {{xp}} XP' },
  appStatusLabel: { ru: 'Статус заявки', tk: 'Arza ýagdaýy' },
  quickActionsLabel: { ru: 'Быстрые действия', tk: 'Çalt hereketler' },
  progressLabel: { ru: 'Прогресс', tk: 'Ilerleme' },
  questsCompleted: { ru: 'Квестов выполнено:', tk: 'Kwestler ýerine ýetirildi:' },
  badgesCount: { ru: 'Значков:', tk: 'Nyşanlar:' },

  // Quick Actions & Tabs
  tabHome: { ru: 'Главная', tk: 'Esasy' },
  tabCertificates: { ru: 'Справки', tk: 'Güwänamalar' },
  tabAdvisor: { ru: 'Куратор', tk: 'Kurator' },
  actionQuests: { ru: 'Квесты', tk: 'Kwestler' },
  actionFaculties: { ru: 'Факультеты', tk: 'Fakultetler' },
  actionProfile: { ru: 'Профиль', tk: 'Profil' },
  actionCertificate: { ru: 'Заказать справку', tk: 'Güwänamany sargaň' },
  actionChat: { ru: 'Написать куратору', tk: 'Kuratora ýazyň' },
  actionDocuments: { ru: 'Документы', tk: 'Resminamalar' },

  // Application Statuses
  statusNew: { ru: 'Новая заявка', tk: 'Täze arza' },
  statusInProgress: { ru: 'На рассмотрении', tk: 'Garaşylýar' },
  statusDocumentsReview: { ru: 'Проверка документов', tk: 'Resminamalary barlamak' },
  statusAccepted: { ru: 'Принят', tk: 'Kabul edildi' },
  statusRejected: { ru: 'Отказ', tk: 'Ret edildi' },

  // Application Hints
  hintNew: { ru: 'Твоя анкета зарегистрирована. Пора проходить квесты, чтобы получить баллы и повысить свой шанс на поступление', tk: 'Anketaňyz hasaba alyndy. Ballary almak we okuwa girmek mümkinçiligiňizi ýokarlandyrmak üçin kwestleri geçmegiň wagty geldi' },
  hintInProgress: { ru: 'Куратор рассматривает твою заявку.', tk: 'Kurator arzanyza seredýär.' },
  hintDocumentsReview: { ru: 'Пожалуйста, загрузи необходимые документы.', tk: 'Haýyş, degişli resminamalary ýükläň.' },
  hintAccepted: { ru: 'Поздравляем! Ваши документы приняты, ожидайте дальнейших указаний.', tk: 'Gutlaýarys! Siziň resminamalaryňyz kabul edildi,indiki görkezmelere garaşyň.' },
  hintRejected: { ru: 'К сожалению, заявка отклонена. Обратись к куратору.', tk: 'Gynansak-da, arza ret edildi. Kurator bilen habarlaşyň.' },

  // Student Home specific
  docDeadlinesLabel: { ru: 'Сроки документов', tk: 'Resminamalaryň möhleti' },
  docVisa: { ru: 'Виза', tk: 'Wiza' },
  docInsurance: { ru: 'Страховка', tk: 'Ätiýaçlandyryş' },
  docRegistration: { ru: 'Регистрация', tk: 'Hasaba alyş' },
  docExpired: { ru: 'Истёк', tk: 'Möhleti gutardy' },
  docToday: { ru: 'Сегодня', tk: 'Şu gün' },
  docDaysLeft: { ru: '{{days}} дн', tk: '{{days}} gün' },
  dataLoadingTitle: { ru: 'Данные загружаются', tk: 'Maglumatlar ýüklenýär' },
  dataLoadingText: { ru: 'Потяните вниз чтобы обновить.\nЕсли проблема повторяется — напишите куратору.', tk: 'Täzelemek üçin aşak çekiň.\nMesele gaýtalansa — kuratora ýazyň.' },
  docMedical: { ru: 'Медосмотр', tk: 'Lukmançylyk barlagy' },

  // Profile specific
  profileTitle: { ru: 'Мой профиль', tk: 'Meniň profilim' },
  roleStudent: { ru: 'Студент', tk: 'Talyp' },
  roleApplicant: { ru: 'Абитуриент', tk: 'Dalaşgär' },
  gameProgressLabel: { ru: 'Игровой прогресс', tk: 'Oýun ösüşi' },
  contactsLabel: { ru: 'Контакты', tk: 'Habarlaşmak' },
  personalDataLabel: { ru: 'Личные данные', tk: 'Şahsy maglumatlar' },
  settingsLabel: { ru: 'Настройки', tk: 'Sazlamalar' },
  languageLabel: { ru: 'Язык', tk: 'Dil' },
  languageInterfaceLabel: { ru: 'Язык интерфейса', tk: 'Interfeýs dili' },
  fullNameLabel: { ru: 'Имя', tk: 'Ady' },
  emailLabel: { ru: 'Email', tk: 'E-poçta' },
  phoneLabel: { ru: 'Телефон', tk: 'Telefon' },
  velayatLabel: { ru: 'Велаят', tk: 'Welaýat' },
  xpLabel: { ru: 'XP', tk: 'XP' },
  badgesLabel: { ru: 'Значки', tk: 'Nyşanlar' },
};

/**
 * Hook to use translations in components
 */
export function useTranslation() {
  const { language } = useAuth();
  const lang = language || 'ru';

  const t = (key: TranslationKey, variables?: Record<string, string | number>) => {
    let text = DICTIONARY[key]?.[lang] || DICTIONARY[key]?.['ru'] || key;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }

    return text;
  };

  return { t, lang };
}
