# QuizMaker Agent Workflow

## Scope
This workflow is project-local to QuizMaker. It applies only inside this repository and only to the agents stored in `.agents/`.

Do not install these agents globally. Do not copy them into global Codex, Cursor, Claude, or system-level configuration directories.

## Required Reading
Any agent working on QuizMaker must read:
1. `PROJECT_CONTEXT.md`
2. The relevant role file in `.agents/`
3. This workflow file

## Development Workflow
1. The human user assigns a task.
2. The Frontend Expert or Backend Expert reads the project context and relevant agent files.
3. The assigned agent implements the task.
4. The assigned agent writes or updates relevant tests.
5. The assigned agent executes the relevant tests.
6. The assigned agent summarizes the work and test results.
7. The assigned agent requests review from the project-local Reviewer.
8. The Reviewer returns `Approved` or `Needs Changes`.
9. If the Reviewer requests changes, the assigned agent applies them unless there is a strong technical reason not to.
10. If the assigned agent disagrees with a Reviewer recommendation, it documents the reason and leaves the decision for the human user.
11. After approval, the assigned agent updates `PROJECT_CONTEXT.md` if the completed task changes important project knowledge.
12. A task is complete only after Reviewer approval or documented human-approved disagreement.

## Frontend Skill And Backend Boundary
The Frontend Expert must read and apply `.agents/skills/vercel-react-best-practices/skills/react-best-practices/SKILL.md` for every frontend task. When a task touches a covered React category, the Frontend Expert must also read the relevant rule files under `.agents/skills/vercel-react-best-practices/skills/react-best-practices/rules/`.

The Frontend Expert must not make backend changes directly. Backend files, backend configuration, backend tests, route/controller/service/validation/prompt/provider code, environment handling, and server startup code belong to the Backend Expert.

When frontend work needs backend support, the Frontend Expert must hand off a precise request to `.agents/backend-expert.md`, including the needed endpoint or contract change, validation and security constraints, frontend dependency, and suggested backend acceptance checks. Frontend integration resumes after the Backend Expert completes the backend task and receives Reviewer approval.

## Backend Skill And Frontend Boundary
The Backend Expert must read and apply `.agents/skills/nodejs-express-server/SKILL.md` for every backend task. When a task needs more detail about Express setup, middleware, database integration, JWT authentication, REST routes, error handling, or environment configuration, the Backend Expert must also read the relevant files under `.agents/skills/nodejs-express-server/references/`.

The Backend Expert must not make frontend changes directly. React components, frontend styles, client routes, browser storage code, frontend API client code, and frontend tests belong to the Frontend Expert.

When backend work needs frontend follow-up, the Backend Expert must document the required frontend change, the API contract or behavior that changed, and any validation, error handling, or security constraints the frontend must honor.

## Project Context Updates
After a task is successfully completed and approved, update `PROJECT_CONTEXT.md` when the task changes:
- Architecture or module responsibilities.
- Public API contracts.
- Data models or storage behavior.
- Security rules or API key handling.
- Testing strategy or required verification commands.
- Important implementation decisions future agents must know.

Do not update `PROJECT_CONTEXT.md` for purely internal refactors, formatting-only changes, or small implementation details that do not affect future project understanding.

## Frontend Task Handoff To Reviewer
The Frontend Expert must provide:
- Files changed.
- User-facing behavior added or changed.
- Component and hook responsibilities.
- Validation and localStorage behavior.
- Tests added or updated.
- Exact test command executed.
- Test result summary.
- Any known limitations.

## Backend Task Handoff To Reviewer
The Backend Expert must provide:
- Files changed.
- Endpoints added or changed.
- Validation behavior.
- Provider integration behavior.
- API key handling behavior.
- Tests added or updated.
- Exact test command executed.
- Test result summary.
- Any known limitations.

## Reviewer Decision Handling
- `Approved`: the task may be considered complete.
- `Needs Changes`: the implementing agent must address the requested changes or document a technical disagreement.
- Security recommendations have the highest priority and should almost never be rejected.
- Disagreements must be specific, technical, and visible to the human user.

## Current Planned Task Order
1. Scaffold the React, Express, and TypeScript project structure.
2. Define shared TypeScript contracts for API requests, API responses, validation limits, and localStorage records.
3. Implement backend health and flashcard generation endpoints.
4. Run backend tests and request Reviewer approval.
5. Implement frontend generation, deck preview, quiz, results, and localStorage flow.
6. Run frontend tests and request Reviewer approval.
7. Run full-system verification.
8. Capture screenshots for assignment evidence.
