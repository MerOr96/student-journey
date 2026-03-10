// ─── User & Auth ───────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  velayat?: string;
  role: UserRole;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'student' | 'admin';
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

// ─── Gamification ──────────────────────────────────────────────
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
  | 'calculate_budget'
  | 'chat_with_advisor'
  | 'upload_photo'
  | 'fill_personal_info'
  | 'submit_documents'
  | 'invite_friend';

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
  | 'first_step'
  | 'document_master'
  | 'explorer'
  | 'social_butterfly'
  | 'quiz_champion'
  | 'budget_planner'
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

// ─── Faculty & Campus ──────────────────────────────────────────
export interface Faculty {
  id: string;
  slug: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  tuitionPerYear: number;
  durationYears: number;
  imageUrl?: string;
}

export interface CampusLocation {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  latitude: number;
  longitude: number;
  category: 'academic' | 'dormitory' | 'dining' | 'sport' | 'library' | 'admin';
  imageUrl?: string;
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
  facultySlugs: string[]; // weighted towards these faculties
}

export interface QuizResult {
  recommendedFaculties: Faculty[];
  scores: Record<string, number>;
}

// ─── Budget Calculator ─────────────────────────────────────────
export interface BudgetInput {
  facultySlug: string;
  dormitory: boolean;
  mealPlan: 'basic' | 'standard' | 'premium';
  insuranceIncluded: boolean;
}

export interface BudgetBreakdown {
  tuition: number;
  dormitory: number;
  meals: number;
  insurance: number;
  estimatedMonthlyLiving: number;
  totalFirstYear: number;
  currency: 'RUB';
}

// ─── Chat ──────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
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

// ─── Admin CRM ─────────────────────────────────────────────────
export interface AdminStudentView extends User {
  profile: PlayerProfile;
  documents: UserDocument[];
  chosenFaculty?: Faculty;
  applicationStatus: ApplicationStatus;
}

export type ApplicationStatus =
  | 'new'
  | 'in_progress'
  | 'documents_review'
  | 'accepted'
  | 'rejected';

export interface AdminDashboardStats {
  totalStudents: number;
  newThisWeek: number;
  documentsSubmitted: number;
  accepted: number;
  averageXp: number;
  topStudents: LeaderboardEntry[];
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
