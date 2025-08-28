import { Timestamp } from 'firebase/firestore';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ChatAnalyticsDoc {
  id: string;
  categoryId?: string | null;
  cityId?: string | null;
  createdAt?: Timestamp | null;
  messageContent?: string | null;
  messageType?: string | null;
  responseTimeMs?: number | null;
  sessionId?: string | null;
  tokensUsed?: number | null;
  userId?: string | null;
}

export interface ChatCategoriesDoc {
  id: string;
  createdAt?: Timestamp | null;
  description?: string | null;
  keywords?: string[] | null;
  name: string;
}

export interface CitiesDoc {
  id: string;
  adminUserId?: string | null;
  agendaEventosUrls?: Json | null;
  allowGeolocation?: boolean | null;
  allowMapDisplay?: boolean | null;
  assistantName?: string | null;
  createdAt?: Timestamp | Date | null;
  currentLanguageCode?: string | null;
  enableGoogleSearch?: boolean | null;
  isActive?: boolean | null;
  isPublic?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  name: string;
  procedureSourceUrls?: Json | null;
  profileImageUrl?: string | null;
  recommendedPrompts?: Json | null;
  restrictedCity?: Json | null;
  sedeElectronicaUrl?: string | null;
  serviceTags?: Json | null;
  slug: string;
  systemInstruction?: string | null;
  updatedAt?: Timestamp | Date | null;
  uploadedProcedureDocuments?: Json | null;
}

export interface ConversationsDoc {
  id: string;
  citySlug?: string | null;
  createdAt: Timestamp;
  title: string;
  updatedAt: Timestamp;
  userId?: string | null;
}

export interface CrawlsDoc {
  id: string;
  apifyRunId?: string | null;
  createdAt: Timestamp;
  domain: string;
  errorMessage?: string | null;
  mode: string;
  startUrl: string;
  stats: Json;
  status: 'pending' | 'processing' | 'completed' | 'error';
  updatedAt: Timestamp;
}

export interface DocumentsDoc {
  id: string;
  content?: string | null;
  crawlId: string;
  createdAt: Timestamp;
  docType: string;
  embedding?: string | null;
  metadata: Json;
  storagePath: string;
  title?: string | null;
  url: string;
}

export interface MessagesDoc {
  id: string;
  content: string;
  conversationId: string;
  createdAt?: Timestamp | null;
  metadata?: Json | null;
  role: string;
}

export interface ProfilesDoc {
  id: string;
  createdAt?: Timestamp | null;
  defaultChatData?: Json | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  lastVisitedCity?: string | null;
  role: 'admin' | 'citizen' | 'ciudadano' | 'administrativo';
  updatedAt?: Timestamp | null;
}

export type UserRole = 'admin' | 'citizen' | 'ciudadano' | 'administrativo';
export type CrawlStatus = 'pending' | 'processing' | 'completed' | 'error';