export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'action_items';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  accuracy?: number;
}

export interface Interaction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  messages: InteractionMessage[];
  summary?: string;
  location?: JournalLocation;
  createdAt: string;
  updatedAt: string;
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  role?: UserRole;
}

export interface SystemTelemetry {
  status: string;
  uptimeSeconds: number;
  geminiConfigured: boolean;
  mapsConfigured: boolean;
  activeModel: string;
  models: string[];
  totalInteractions: number;
  totalLocationsPinned: number;
  rbacEnforced: boolean;
  tenantIsolation: boolean;
  timestamp: string;
}

export interface NotificationPayload {
  channel: 'discord' | 'slack' | 'email';
  webhookUrl?: string;
  recipientEmail?: string;
  title: string;
  summary: string;
  locationName?: string;
}

export type EmotionalTone = 'calm' | 'focused' | 'reflective' | 'energized' | 'introspective';

export interface CognitiveMetrics {
  clarityScore: number;
  emotionalTone: EmotionalTone;
  wordCount: number;
  sentimentValence: 'positive' | 'neutral' | 'growth';
  dominantThemes: string[];
}

export interface AudioTranscriptionResult {
  transcript: string;
  toneDetected?: EmotionalTone;
  confidence?: number;
  durationSeconds?: number;
}

export interface HeatmapDayData {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  dominantMode?: ReflectionMode;
  entries: { id: string; title: string; mode: ReflectionMode; words: number }[];
}
