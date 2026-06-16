# QuizMaker Project Context

## Purpose
QuizMaker is a small full-stack learning app. Users provide a topic, difficulty level, and desired number of flashcards. The backend uses Google Gemini to generate flashcards, and the frontend lets users review the generated deck, quiz themselves, and save learning progress locally.

This file is the primary project-local context document for future AI coding sessions. Any AI agent working on QuizMaker must read this file before making implementation decisions.

## Project-Local Agent Constraint
- Agent instructions for this project live only in this repository under `.agents/`.
- Do not install these agents globally.
- Do not copy these agents into global Codex, Cursor, Claude, or system-level configuration directories.
- Treat these files as local project documentation, not universal behavior.

## Tech Stack
- Frontend: React, TypeScript, Vite, CSS Modules.
- Backend: Node.js, Express, TypeScript.
- AI provider: Google Gemini API through `@google/genai`.
- Storage: browser localStorage for decks, quiz attempts, scores, and non-sensitive preferences.
- Testing: Vitest, React Testing Library, and Supertest.

## Core User Flow
1. User enters a topic, difficulty, and number of flashcards.
2. User optionally provides a Gemini API key for one request if the backend `.env` key is unavailable.
3. Frontend sends the generation request to the backend.
4. Backend validates input and calls Gemini.
5. Backend returns a structured flashcard deck.
6. Frontend displays the deck preview.
7. User starts a quiz.
8. User reveals answers and marks each card correct or incorrect.
9. Frontend shows final quiz results.
10. Frontend saves decks and quiz history in localStorage.

## Core API Contract
Endpoints:

```http
GET /api/health
```

Success response:

```ts
{
  status: "ok";
  timestamp: string;
}
```

```http
POST /api/generate-flashcards
```

Request body:

```ts
{
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  count: number;
  apiKey?: string;
}
```

Validation rules:
- `topic`: trim before validation; must be 1-120 characters.
- `difficulty`: must be `beginner`, `intermediate`, or `advanced`.
- `count`: must be an integer from 1-20.
- `apiKey`: optional; use only for the current request and never store or log it.

Success response:

```ts
{
  deckId: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  cards: {
    id: string;
    question: string;
    answer: string;
  }[];
}
```

Error response:

```ts
{
  error: string;
  code?: "VALIDATION_ERROR" | "MISSING_API_KEY" | "GENERATION_FAILED";
  fields?: Record<string, string>;
}
```

Do not expose provider stack traces, raw Gemini errors, prompt contents, API keys, or other sensitive internals in API errors.

## Shared Contracts
Define shared TypeScript contracts during project scaffolding so frontend and backend use the same request, response, validation, and storage shapes.

Shared contracts should include:
- `Difficulty`
- `Flashcard`
- `FlashcardDeck`
- `GenerateFlashcardsRequest`
- `GenerateFlashcardsResponse`
- `ApiErrorResponse`
- Validation constants for topic length, difficulty values, and card count range.

## Security Rules
- Prefer `GEMINI_API_KEY` from the backend `.env` file.
- Optional user-provided API keys are allowed only for one request.
- Never store API keys in localStorage, sessionStorage, source code, logs, screenshots, or test snapshots.
- Never log sensitive request data.
- Validate all backend input before calling Gemini.
- Use safe, user-friendly error messages.
- Keep server-side AI integration behind the Express API.

## Local Storage Contract
Use versioned localStorage keys and never store secrets.

Keys:
- `quizmaker:v1:decks`
- `quizmaker:v1:quiz-history`
- `quizmaker:v1:preferences`

Deck record:

```ts
{
  deckId: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  cards: {
    id: string;
    question: string;
    answer: string;
  }[];
  createdAt: string;
}
```

Quiz history record:

```ts
{
  attemptId: string;
  deckId: string;
  score: number;
  total: number;
  answers: {
    cardId: string;
    correct: boolean;
  }[];
  completedAt: string;
}
```

Preferences must contain only non-sensitive UI preferences. Do not store Gemini API keys or generated prompt data.

## Expected Screens
- Flashcard generation form.
- Generated deck preview.
- Quiz question screen.
- Quiz answer reveal state.
- Quiz results screen.
- Saved decks or quiz history view.

## Quality Standards
- Keep frontend components focused and reusable.
- Keep backend routes thin and place business logic in services.
- Prefer clear names over clever abstractions.
- Avoid duplicated validation, mapping, and API logic.
- Write meaningful tests before requesting review.
- A task is not complete until the project-local Reviewer approves it or a human accepts a documented disagreement.

## Required Assignment Evidence
- Screenshot of a functioning quiz question screen.
- Screenshot of a functioning quiz results screen.
- Optional screenshot of passing tests, API response, or terminal logs.

## Planned Task Order
1. Scaffold the React, Express, and TypeScript project structure.
2. Define shared TypeScript contracts for API requests, API responses, validation limits, and localStorage records.
3. Implement backend health and flashcard generation endpoints.
4. Run backend tests and request Reviewer approval.
5. Implement frontend generation, deck preview, quiz, results, and localStorage flow.
6. Run frontend tests and request Reviewer approval.
7. Run full-system verification.
8. Capture screenshots for assignment evidence.
