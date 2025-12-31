
export enum AppRole {
  DASHBOARD = 'dashboard',
  CITIZEN = 'citizen',
  OFFICIAL = 'official',
  AGENT = 'agent'
}

export interface BhashiniConfig {
  userId: string;
  apiKey: string;
  pipelineId: string;
  active: boolean;
}

export interface Policy {
  id: string;
  title: string;
  originalText: string;
  category: string;
  publishedAt: string;
  simplifiedVersions?: Record<string, string>;
  bhashiniEnabled?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
  engine?: 'gemini' | 'bhashini';
  image?: string; // Base64 image data
}

export interface ConversationLog {
  id: string;
  userId: string;
  query: string;
  response: string;
  language: string;
  timestamp: string;
  status: 'normal' | 'flagged';
}

export const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'en', name: 'English', native: 'English' }
];
