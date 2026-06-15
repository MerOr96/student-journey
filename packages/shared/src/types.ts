// ─── User & Auth ───────────────────────────────────────────────
export type ApplicationStatus = 'NEW' | 'IN_PROGRESS' | 'DOCUMENTS_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  velayat?: string;
  role: UserRole;
  appRole: AppRole;
  applicationStatus: ApplicationStatus;
  language: Language;
  crmApplicantId?: number | null;
  crmStudentId?: number | null;
  chosenFacultyName?: string | null;
  chosenSpecialtyName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmApplicantStatus {
  id: number;
  full_name: string;
  email: string;
  status: string;
  faculty_name: string | null;
  specialty_name: string | null;
  submission_date: string;
  is_converted: boolean;
}

export interface CrmStudentProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  course: number;
  specialty: string | null;
  education_form: string | null;
  study_group: string | null;
  citizenship: string;
  region: string | null;
  visa_end: string | null;
  insurance_end: string | null;
  registration_expiry: string | null;
  passport_valid_until: string | null;
  passport_number: string | null;
  budget: boolean;
  medical_exam_expiry: string | null;
  fingerprint_end: string | null;
  migration_card_end: string | null;
  living_address: string | null;
  pending_document_uploads?: string[];
  outside_russia: boolean;
}

// system role: user vs admin
export type UserRole = 'user' | 'admin';
// journey role: applicant vs student
export type AppRole = 'applicant' | 'student';
export type Language = 'ru' | 'tk';

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
  velayat?: string;
  language: Language;
}

// ─── Gamification (только для абитуриентов) ────────────────────
export type LevelSlug =
  | 'beginner'
  | 'applicant'
  | 'future_student'
  | 'documents_submitted'
  | 'accepted_student';

export interface Level {
  slug: LevelSlug;
  title: Record<Language, string>;
  minXp: number;
  icon: string;
}

export interface PlayerProfile {
  userId: string;
  xp: number;
  level: LevelSlug;
  completedQuests: string[];
  badges: string[];
}

// ─── Velayat (Turkmen provinces) ──────────────────────────────
export type VelayatSlug = 'ahal' | 'balkan' | 'dashoguz' | 'lebap' | 'mary' | 'ashgabat';

export interface VelayatOption {
  slug: VelayatSlug;
  name: Record<Language, string>;
}

export type QuestSlug =
  | 'upload_passport'
  | 'choose_faculty'
  | 'career_quiz'
  | 'join_imo_channel'
  | 'chat_with_advisor'
  | 'submit_documents'
  | 'invite_friend'
  | 'application_approved';

export interface Quest {
  slug: QuestSlug;
  title: Record<Language, string>;
  description: Record<Language, string>;
  xpReward: number;
  requiredLevel: LevelSlug;
  badgeSlug?: string;
}

export interface QuestCompletion {
  id: string;
  userId: string;
  questSlug: QuestSlug;
  completedAt: string;
  xpAwarded: number;
}

export type BadgeSlug =
  | 'document_master'
  | 'explorer'
  | 'social_butterfly'
  | 'quiz_champion'
  | 'community_member'
  | 'ai_friend'
  | 'ready_to_go';

export interface Badge {
  slug: BadgeSlug;
  title: Record<Language, string>;
  description: Record<Language, string>;
  icon: string;
}

// ─── Leaderboard ───────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  xp: number;
  level: LevelSlug;
  badgeCount: number;
}

// ─── Faculty ───────────────────────────────────────────────────────
export interface Faculty {
  id: number;
  name: string;
}

export interface Specialty {
  id: number;
  name: string;
  study_form: string;
  faculty: number;
  faculty_name: string;
}

// ─── Career Quiz ───────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  text: Record<Language, string>;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: Record<Language, string>;
  facultySlugs: string[];
}

export interface QuizResult {
  recommendedFaculties: Faculty[];
  scores: Record<string, number>;
}

// ─── Chat (AI) ─────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// ─── Live Chat (студент ↔ куратор) ────────────────────────────
export interface LiveMessage {
  id: string;
  userId: string;
  fromUser: boolean;  // true = студент, false = куратор
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Documents ─────────────────────────────────────────────────
export type DocumentType = 'passport' | 'photo' | 'diploma' | 'medical' | 'other';

export interface UserDocument {
  id: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

// ─── Certificate Requests (справки/ходатайства) ───────────────
export type CertificateRequestType = 'certificate' | 'petition' | 'other';
export type CertificateRequestStatus = 'pending' | 'processing' | 'ready' | 'issued';

export interface CertificateRequest {
  id: string;
  request_type: CertificateRequestType;
  request_type_display: string;
  description: string;
  status: CertificateRequestStatus;
  status_display: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateRequestCreateDto {
  email: string;
  request_type: CertificateRequestType;
  description: string;
}

// ─── Exams & Notifications (Phase 2) ─────────────────────────────
export interface ExamMaterial {
  title: string;
  url: string;
}

export interface Exam {
  id: string;
  userId: string;
  subject: string;
  examDate: string;
  meetingLink?: string;
  score?: number;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  materials?: ExamMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'PERSONAL' | 'MASS' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

// ─── API Responses ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
