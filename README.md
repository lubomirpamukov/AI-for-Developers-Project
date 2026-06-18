# QuizMaker

QuizMaker is a small full-stack learning app scaffolded as an npm workspace.

## Workspaces

- `shared`: TypeScript contracts, validation constants, and localStorage key names.
- `backend`: Express and TypeScript API scaffold.
- `frontend`: React, TypeScript, Vite, and CSS Modules scaffold.

## Commands

```sh
npm install
npm run typecheck
npm test
npm run dev:backend
npm run dev:frontend
```

The backend keeps Gemini and OpenAI integration behind the Express API. Use `GEMINI_API_KEY` or `OPENAI_API_KEY` for server-side provider credentials, with optional one-request user keys allowed by the API contract. Do not store provider API keys in frontend storage, logs, screenshots, or test snapshots.
