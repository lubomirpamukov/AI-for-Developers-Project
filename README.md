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

The backend keeps Gemini integration behind the Express API. Do not store Gemini API keys in frontend storage, logs, screenshots, or test snapshots.
