export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 without prefix
  previewUrl: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: Attachment[];
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  category?: 'coding' | 'translation' | 'writing' | 'general' | 'study';
}

export interface UserSettings {
  model: 'gemini-2.5-flash' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  temperature: number;
  systemInstruction: string;
  useSearch: boolean;
  autoSpeak: boolean;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  soundEffects: boolean;
  language: 'uz' | 'en' | 'ru';
}
