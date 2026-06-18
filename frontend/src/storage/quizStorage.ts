import type {
  ApiProvider,
  Difficulty,
  QuizHistoryRecord,
  StoredFlashcardDeck
} from "@quizmaker/shared";
import { STORAGE_KEYS } from "@quizmaker/shared";

export interface UserPreferences {
  lastDifficulty?: Difficulty;
  lastCount?: number;
  lastProvider?: ApiProvider;
}

export function loadStoredDecks(): StoredFlashcardDeck[] {
  return readJsonArray<StoredFlashcardDeck>(STORAGE_KEYS.decks);
}

export function saveStoredDecks(decks: StoredFlashcardDeck[]) {
  writeJson(STORAGE_KEYS.decks, decks);
}

export function loadQuizHistory(): QuizHistoryRecord[] {
  return readJsonArray<QuizHistoryRecord>(STORAGE_KEYS.quizHistory);
}

export function saveQuizHistory(history: QuizHistoryRecord[]) {
  writeJson(STORAGE_KEYS.quizHistory, history);
}

export function loadPreferences(): UserPreferences {
  const raw = readRaw(STORAGE_KEYS.preferences);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return {};
  }
}

export function savePreferences(preferences: UserPreferences) {
  writeJson(STORAGE_KEYS.preferences, preferences);
}

function readJsonArray<T>(key: string): T[] {
  const raw = readRaw(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable or over quota. Keep the app usable.
  }
}
