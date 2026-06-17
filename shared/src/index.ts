export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const VALIDATION_LIMITS = {
  topicMinLength: 1,
  topicMaxLength: 120,
  countMin: 1,
  countMax: 20
} as const;

export const STORAGE_KEYS = {
  decks: "quizmaker:v1:decks",
  quizHistory: "quizmaker:v1:quiz-history",
  preferences: "quizmaker:v1:preferences"
} as const;

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface FlashcardDeck {
  deckId: string;
  topic: string;
  difficulty: Difficulty;
  cards: Flashcard[];
}

export interface StoredFlashcardDeck extends FlashcardDeck {
  createdAt: string;
}

export interface GenerateFlashcardsRequest {
  topic: string;
  difficulty: Difficulty;
  count: number;
  apiKey?: string;
}

export type GenerateFlashcardsResponse = FlashcardDeck;

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "MISSING_API_KEY"
  | "GENERATION_FAILED";

export interface ApiErrorResponse {
  error: string;
  code?: ApiErrorCode;
  fields?: Record<string, string>;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface QuizAnswerRecord {
  cardId: string;
  correct: boolean;
}

export interface QuizHistoryRecord {
  attemptId: string;
  deckId: string;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
  completedAt: string;
}

export interface UserPreferences {
  lastDifficulty?: Difficulty;
  lastCount?: number;
}
