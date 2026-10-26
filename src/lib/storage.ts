import { Conversation, UserSettings } from '../types';

const CONVERSATIONS_KEY = 'zoir_ai_conversations_v1';
const SETTINGS_KEY = 'zoir_ai_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  systemInstruction: `Siz "ZOIR AI" - O'zbekiston va butun dunyo foydalanuvchilari uchun maxsus yaratilgan eng aqlli, muloyim va kuchli universal AI yordamchisiz.
Har doim savodli, aniq, muloyim va to'liq javob bering. Dasturlash, tarjima, matn yozish va tahlilda mukammal yordam ko'rsating.`,
  useSearch: false,
  autoSpeak: false,
  voiceName: 'Kore',
  soundEffects: true,
  language: 'uz',
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load conversations', e);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations', e);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportAllData(): string {
  const data = {
    app: 'ZOIR AI',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    conversations: loadConversations(),
    settings: loadSettings(),
  };
  return JSON.stringify(data, null, 2);
}
