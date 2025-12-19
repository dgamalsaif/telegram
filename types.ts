
export interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
}

export interface UserProfile {
  agentName: string;
  telegramHandle: string;
  operationalId: string;
  isRegistered: boolean;
  apiId?: string;
  apiHash?: string;
  phoneNumber?: string;
  syncStatus?: 'disconnected' | 'syncing' | 'authorized';
}

export interface TelegramGroup {
  id: string;
  title: string;
  description: string;
  url: string;
  sourcePostUrl?: string; 
  category?: string;
  isPrivate: boolean;
  isProfessional?: boolean;
  platformSource: string;
  linkType: 'Telegram' | 'WhatsApp' | 'Discord';
  country?: string;
  language?: string;
  timestamp: string;
  confidenceScore: number;
  joinMethod?: 'inviteLink' | 'username' | 'idSearch' | 'mention';
}

export interface TelegramMessage {
  id: string;
  text: string;
  sender: string;
  date: string;
  groupTitle: string;
  url: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
  type: SearchType;
}

export interface SearchResult {
  text: string;
  sources: Array<{ title: string; uri: string }>;
  parsedGroups: TelegramGroup[];
  messages?: TelegramMessage[];
  summary?: {
    totalDetected: number;
    privateRatio: string;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
}

export type SearchMode = 'quick' | 'deep';
export type SearchType = 'topic' | 'user';

export interface SearchParams {
  query: string;
  country: string;
  language: string;
  category: string;
  platforms: Platform[];
  mode: SearchMode;
  searchType: SearchType;
  agentContext?: UserProfile;
}

declare global {
  interface Window {
    process: {
      env: {
        API_KEY?: string;
        [key: string]: any;
      };
    };
  }
}
