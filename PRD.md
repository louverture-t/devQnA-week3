# DevQ&A Platform - PRD / Reverse-Engineering Spec (Source of Truth)

**Project:** Client-Server Essentials Capstone - DevQ&A Platform

**Goal:** Build a full-stack Q&A app (mini Stack Overflow) where a React client communicates with a TypeScript Express API backed by PostgreSQL, with robust auth, CRUD, voting, pagination, and test coverage (TDD + E2E).

## 0) Build blueprint (root, backend, frontend)

### Root tooling (repo root)

Create a root package.json with these scripts:

```json
{
  "name": "devqa-platform",
  "version": "1.0.0",
  "description": "Full-stack Q&A platform for developers",
  "private": true,
  "scripts": {
    "dev": "npm run start:dev",
    "start:dev": "node start-dev.js",
    "start:dev:full": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "client:dev": "npm run dev --prefix client",
    "server:dev": "npm run dev --prefix server",
    "test": "npm run test --prefix server",
    "test:e2e": "npm run test:e2e --prefix client",
    "test:e2e:report": "node open-report.js",
    "test:e2e:report:server": "cd client && npx playwright show-report --port 9324",
    "build": "npm run build --prefix client && npm run build --prefix server",
    "start": "npm start --prefix server"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

Add start-dev.js (Windows-safe npm spawning; starts server + client when client/ exists):

```js
const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = __dirname;
const clientPackageJsonPath = path.join(rootDir, "client", "package.json");

const hasClient = existsSync(clientPackageJsonPath);
const scriptToRun = hasClient ? "start:dev:full" : "server:dev";
const npmExecPath = process.env.npm_execpath;
const canRunNpmViaNode = Boolean(npmExecPath && existsSync(npmExecPath));

if (!hasClient) {
  // Keep root `npm run start:dev` usable even when the frontend isn't present.
  console.warn(
    "[devqa-platform] No ./client/package.json found - starting backend only (npm run server:dev)."
  );
}

// On Windows, spawning `npm.cmd` directly can throw `spawn EINVAL` depending on Node/version/shell.
// The most reliable approach is to run npm's CLI JS via Node when available.
// (When invoked via `npm run ...`, `npm_execpath` is set by npm.)
const command = canRunNpmViaNode
  ? process.execPath
  : process.platform === "win32"
    ? "cmd.exe"
    : "npm";

const args = canRunNpmViaNode
  ? [npmExecPath, "run", scriptToRun]
  : process.platform === "win32"
    ? ["/d", "/s", "/c", "npm", "run", scriptToRun]
    : ["run", scriptToRun];

const child = spawn(command, args, {
  cwd: rootDir,
  stdio: "inherit",
});

const forwardSignal = (signal) => () => {
  if (!child.killed) child.kill(signal);
};

process.on("SIGINT", forwardSignal("SIGINT"));
process.on("SIGTERM", forwardSignal("SIGTERM"));

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
```

Add open-report.js (opens the Playwright HTML report cross-platform):

```js
const { spawn } = require("node:child_process");
const path = require("node:path");

const reportPath = path.join(__dirname, "client", "playwright-report", "index.html");

console.log(`[devqa-platform] Opening Playwright report: ${reportPath}`);

// Determine the command and args based on OS
let command, args, options;

if (process.platform === "win32") {
  // Windows: Use cmd.exe without shell option to avoid deprecation warning
  command = "cmd.exe";
  args = ["/c", "start", "", reportPath];
  options = { stdio: "ignore", detached: true };
} else if (process.platform === "darwin") {
  // macOS: Use open command
  command = "open";
  args = [reportPath];
  options = { stdio: "ignore", detached: true };
} else {
  // Linux: Use xdg-open command
  command = "xdg-open";
  args = [reportPath];
  options = { stdio: "ignore", detached: true };
}

const child = spawn(command, args, options);

// Detach the child process so it can continue after this script exits
child.unref();

console.log("[devqa-platform] Report opened in default browser");
```

### Backend (server/) - Express + TypeScript + Sequelize + Postgres

- Create the Express app (server/src/app.ts) with:
  - CORS allowlist for http://localhost:5173, :5174, :5175
  - /health endpoint (non-/api)
  - route mounts:
    - /api/auth -> auth routes
    - /api/questions -> questions routes
    - /api -> answers routes (includes /questions/:questionId/answers + /answers/:id)
    - /api/answers -> votes routes (includes /:answerId/vote)
    - /api/users -> users routes
  - global errorHandler last
- Implement DB config (server/src/config/database.ts):
  - uses devqa_test when NODE_ENV === "test"
  - calls sequelize.sync() on startup (capstone mode)
  - retries sync on the known Postgres catalog unique-violation race during dev restarts
- Implement Sequelize models + associations (server/src/models/* + server/src/models/index.ts)
  - lowercase table names: users, questions, answers, votes
  - FK fields mapped to snake_case via field in all but users
  - vote unique constraint: (answer_id, user_id)
- Implement auth:
  - JWT middleware attaches req.user = { id, username, email }
  - POST /api/auth/login returns { token, user } with expiry (expiresIn: "1h")
  - As-built mismatch: POST /api/auth/register returns user only; GET /api/auth/verify returns user only (see §11.1)
- Implement Q&A + voting endpoints exactly as specified in §7 API contract
- Add backend tests:
  - server/vitest.config.ts: run serially (singleFork: true)
  - server/tests/setup.ts: reset DB before each test using TRUNCATE + RESTART IDENTITY + CASCADE
  - API tests in server/tests/api/*, model tests in server/tests/db/*

### Frontend (client/) - React + Vite + TypeScript + Tailwind

- Scaffold the app (Vite React TS), then implement modules per §5.1.
- Keep the API wiring consistent:
  - client/vite.config.ts proxies /api -> http://localhost:4000
  - client/src/services/api.ts uses baseURL = VITE_API_URL || "/api"
  - request interceptor attaches Authorization: Bearer <token>
  - response interceptor clears storage and redirects on 401
- Keep E2E selectors stable (Playwright depends on them): see §8.4 and client/tests/e2e/helpers/selectors.ts.
- E2E tests (client/tests/e2e):
  - client/playwright.config.ts starts:
    - backend: npm run dev --prefix ../server and waits on http://localhost:4000/health
    - frontend: npm run dev and waits on http://localhost:5173
  - Ensure the full user flow passes as specified in full-flow.spec.ts.

## 1) As-built snapshot (current repo)

### 1.1 Repository layout

| Path | Description |
| --- | --- |
| client/ | React + Vite + TypeScript app |
| server/ | Express + TypeScript + Sequelize API |
| database/ | DB-focused guide/docs |

Key entrypoints:

- Frontend routes: client/src/App.tsx
- API client: client/src/services/api.ts
- Backend app (for tests): server/src/app.ts
- Backend server startup: server/src/index.ts
- Sequelize config + sync: server/src/config/database.ts

### 1.2 Runtime prerequisites

- Node.js: 18+ (Vite 5)
- PostgreSQL: 14+ (local)
- Optional: DBeaver/pgAdmin for DB inspection

### 1.3 One-time setup (clean clone)

Create local databases:

```sql
CREATE DATABASE devqa;
CREATE DATABASE devqa_test;
```

Create a backend env file:

- Copy server/.env.example -> server/.env
- Fill in at minimum:
  - DB_PASSWORD (your local Postgres password)
  - JWT_SECRET (any long random string)

Install dependencies (important: not a workspace monorepo):

```bash
# root tooling (concurrently, root scripts)

npm install

# backend deps
npm install --prefix server

# frontend deps
npm install --prefix client
```

Gotcha: npm install at the root does not install client/ or server/ dependencies. You must install each.

### 1.4 Run (development)

From repo root:

```bash
npm run start:dev
```

URLs:

- Backend health: http://localhost:4000/health
- Frontend: http://localhost:5173

### 1.5 Run tests

From repo root:

```bash
# backend unit/integration tests (Vitest + Supertest)

npm run test

# Playwright E2E (auto-starts backend+frontend)

npm run test:e2e
```

## 2) Final decisions (locked / non-negotiables)

### 2.1 Core build choices

| Area | Decision |
| --- | --- |
| ORM | Sequelize |
| DB table creation | sequelize.sync() (capstone mode) |
| Database | PostgreSQL (local) |
| Backend | Express + TypeScript |
| Architecture | MVC-ish (Models/Controllers/Routes; React is the UI) |

### 2.2 Auth decisions

- Password validation: minimum 8 characters only
- Password storage: bcrypt hash (never store plaintext)
- JWT storage on client: localStorage (keys: token, user)
- JWT expiry: required (as-built: 1h)
- JWT payload shape: { id, username, email } (not userId)

### 2.3 Voting rules (locked)

- One vote per user per answer (DB unique constraint)
- Clicking the same vote toggles it off (removes vote)
- Clicking the opposite vote switches vote type
- User cannot vote on their own answer (403)

### 2.4 Pagination rules (locked)

- Questions list: page + limit
- Default limit: 10
- Limit clamps to max 50

### 2.5 Error contract (locked)

- All backend error responses are JSON: { "error": "Human-readable message" }
- Frontend displays errors in a single standard area: data-testid="error-message"
- Forbidden actions: keep UI controls visible; show 403 error in that standard area

### 2.6 Routes (locked)

React routes implemented in client/src/App.tsx:

| Visibility | Routes |
| --- | --- |
| Public | /register, /login, /users |
| Protected (requires auth via ProtectedRoute) | /questions, /questions/:id |

Notes:

- / and unknown routes redirect to /questions (which then redirects to /login if unauthenticated).
- /tags appears in the navigation but is currently disabled (no route/page yet).

## 3) Tech stack (actual locked versions)

Source: .ai-rules/tech-stack.md (validated against lockfiles)

### 3.1 Frontend (client/)

| Package | Version |
| --- | --- |
| React | 18.3.1 |
| React DOM | 18.3.1 |
| React Router DOM | 6.30.3 |
| Vite | 5.4.21 |
| @vitejs/plugin-react | 4.7.0 |
| TypeScript | 5.9.3 |
| Axios | 1.13.4 |
| Tailwind CSS | 3.4.19 |
| PostCSS | 8.5.6 |
| Autoprefixer | 10.4.24 |
| Playwright (@playwright/test) | 1.58.1 |
| UI | Tailwind + shadcn/ui vendored components in client/src/components/ui/ |

### 3.2 Backend (server/)

| Package | Version |
| --- | --- |
| Express | 4.22.1 |
| Sequelize | 6.37.7 |
| pg | 8.18.0 |
| jsonwebtoken | 9.0.3 |
| bcrypt | 5.1.1 |
| cors | 2.8.6 |
| dotenv | 16.6.1 |
| TypeScript | 5.9.3 |
| Vitest | 2.1.9 |
| Supertest | 7.2.2 |
| ts-node-dev | 2.0.0 |

Note: @types/express is 5.0.6 while Express runtime is 4.x (types may feel off).

### 3.3 Root tooling

| Package | Version |
| --- | --- |
| concurrently | 9.2.1 |

## 4) Commands and scripts (as-built)

### 4.1 Root scripts (package.json)

| Script | Purpose |
| --- | --- |
| npm run start:dev | main dev entrypoint (node start-dev.js) |
| npm run server:dev | runs backend dev server (npm run dev --prefix server) |
| npm run client:dev | runs Vite (npm run dev --prefix client) |
| npm run test | backend tests (npm run test --prefix server) |
| npm run test:e2e | Playwright E2E (npm run test:e2e --prefix client) |
| npm run test:e2e:report | open Playwright HTML report (node open-report.js) |
| npm run build | build client + server |
| npm run start | start production server (server only) |

### 4.2 Backend scripts (server/package.json)

| Script | Purpose |
| --- | --- |
| npm run dev | ts-node-dev --respawn --transpile-only src/index.ts |
| npm run build | tsc |
| npm run test | vitest |

Gotcha: backend dev uses --transpile-only (fast, but can hide TypeScript errors). For real type safety, use npm run build --prefix server.

### 4.3 Frontend scripts (client/package.json)

| Script | Purpose |
| --- | --- |
| npm run dev | Vite dev server (5173) |
| npm run build | tsc && vite build |
| npm run test:e2e | playwright test |

## 5) Architecture and module map

### 5.1 Frontend

| Area | File |
| --- | --- |
| Routing | client/src/App.tsx |
| Auth state + localStorage | client/src/context/AuthContext.tsx |
| API wrapper + interceptors | client/src/services/api.ts |
| Layout shell (header/sidebar/footer) + logout | client/src/components/Layout.tsx (data-testid="logout-button", data-testid="app-footer") |
| Global styles (glassmorphism + tokens) | client/src/index.css |
| Pages | client/src/pages/RegisterPage.tsx; LoginPage.tsx; QuestionsListPage.tsx; QuestionDetailPage.tsx; UsersPage.tsx (public) |
| UI contract for E2E | client/src/components/ErrorMessage.tsx (data-testid="error-message") |
| Selector list | client/tests/e2e/helpers/selectors.ts |

### 5.2 Backend

| Area | File |
| --- | --- |
| Express app (imported by Supertest) | server/src/app.ts |
| Server startup (listens on port) | server/src/index.ts |
| Sequelize config + sync | server/src/config/database.ts |
| Models + associations | server/src/models/index.ts |
| Routes | server/src/routes/*.routes.ts |
| Controllers | server/src/controllers/*.controller.ts |
| Auth middleware | server/src/middleware/auth.ts |

## 6) Database and models (Sequelize + Postgres)

### 6.1 Databases

- Dev DB: devqa
- Test DB: devqa_test (selected when NODE_ENV === "test")

### 6.2 Environment variables (server/.env)

Template: server/.env.example

Required keys:

| Key | Notes |
| --- | --- |
| DB_NAME | dev DB name; default devqa |
| DB_USER | default postgres |
| DB_PASSWORD | required |
| DB_HOST | default localhost |
| DB_PORT | default 5432 |
| JWT_SECRET | required |
| BCRYPT_SALT_ROUNDS | default 10 |
| PORT | default 4000 |

### 6.3 Naming rules (as-built)

- Table names are lowercase: users, questions, answers, votes
- Foreign key columns in Postgres use snake_case via field:
  - questions.user_id
  - answers.question_id, answers.user_id
  - votes.answer_id, votes.user_id
- Model attributes and API JSON use camelCase: userId, questionId, answerId
- As-built gotcha: users model does not set underscored: true, so its timestamp columns are likely createdAt/updatedAt in Postgres, while other tables use created_at/updated_at.

### 6.4 Entities (as-built)

**users**

| Column | Notes |
| --- | --- |
| id | PK |
| username | unique |
| email | unique |
| password_hash |  |
| timestamps | see note above |

**questions**

| Column | Notes |
| --- | --- |
| id | PK |
| title |  |
| body |  |
| user_id | FK -> users.id |
| created_at |  |
| updated_at |  |

**answers**

| Column | Notes |
| --- | --- |
| id | PK |
| body |  |
| question_id | FK -> questions.id |
| user_id | FK -> users.id |
| created_at |  |
| updated_at |  |

**votes**

| Column | Notes |
| --- | --- |
| id | PK |
| type | ENUM('up','down') |
| answer_id | FK -> answers.id |
| user_id | FK -> users.id |
| created_at |  |
| updated_at |  |
| UNIQUE | (answer_id, user_id) |

### 6.5 Associations (as-built)

- User 1->many Question
- User 1->many Answer
- User 1->many Vote
- Question 1->many Answer
- Answer 1->many Vote
- Vote belongsTo User + Answer

### 6.6 Sync behavior (sequelize.sync())

server/src/config/database.ts exports syncDatabase() which:

- imports server/src/models to ensure models + associations are loaded
- calls sequelize.sync()
- retries a few times on a known Postgres catalog unique-violation race during dev hot restarts

### 6.7 Test DB reset strategy (locked, as-built)

Backend tests reset DB before each test:

- first run: sequelize.sync({ force: true })
- each test: TRUNCATE all public tables with RESTART IDENTITY CASCADE
- tests run serially to avoid DB conflicts (singleFork: true in server/vitest.config.ts)

## 7) API contract (canonical) + as-built notes

### 7.1 Global conventions

| Item | Value |
| --- | --- |
| Base path | /api |
| Errors | { "error": "..." } |
| Auth header | Authorization: Bearer <token> |
| Health | GET /health -> { "status": "ok", "timestamp": "ISO-8601 string" } |

### 7.2 Auth

#### POST /api/auth/register

Body:

```json
{ "username": "johndoe", "email": "john@example.com", "password": "password123" }
```

Rules:

- required: username/email/password
- password min length 8

Canonical response (recommended for consistent client UX):

```json
{ "token": "jwt...", "user": { "id": 1, "username": "johndoe", "email": "john@example.com" } }
```

As-built response (current repo):

```json
{ "id": 1, "username": "johndoe", "email": "john@example.com", "createdAt": "...", "updatedAt": "..." }
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 400 | Username, email, and password are required |
| 400 | Password must be at least 8 characters |
| 409 | Username already exists |
| 409 | Email already exists |
| 500 | Internal server error |

#### POST /api/auth/login

Body:

```json
{ "email": "john@example.com", "password": "password123" }
```

Response (as-built and canonical):

```json
{ "token": "jwt...", "user": { "id": 1, "username": "johndoe", "email": "john@example.com" } }
```

Notes (as-built):

- JWT expires in 1h
- 401 returns the generic "Invalid credentials"

#### GET /api/auth/verify (protected)

Response (canonical):

```json
{ "user": { "id": 1, "username": "johndoe", "email": "john@example.com" } }
```

As-built response (current repo):

```json
{ "id": 1, "username": "johndoe", "email": "john@example.com", "createdAt": "...", "updatedAt": "..." }
```

### 7.3 Questions

#### GET /api/questions?page=1&limit=10 (public)

Behavior (as-built):

- default page=1
- default limit=10
- clamp limit to max 50

Response (as-built):

```json
{
  "items": [
    {
      "id": 1,
      "title": "How do I ...?",
      "body": "Question body",
      "userId": 1,
      "createdAt": "...",
      "updatedAt": "...",
      "user": { "id": 1, "username": "johndoe" }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalItems": 1,
  "totalPages": 1
}
```

#### GET /api/questions/:id (public)

As-built includes:

- question
- user: { id, username }
- answers: [...] and each answer includes user: { id, username }

As-built does not include per-answer voteCount / userVote.

Errors (as-built):

| Status | Message |
| --- | --- |
| 400 | Invalid question ID |
| 404 | Question not found |

#### POST /api/questions (protected)

Body:

```json
{ "title": "How do I ...?", "body": "Provide details..." }
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 400 | Title and body are required |
| 400 | Title and body cannot be empty |
| 401 | auth middleware errors (missing/invalid/expired token) |

#### PUT /api/questions/:id (protected, owner-only)

Errors (as-built):

| Status | Message |
| --- | --- |
| 403 | Not authorized to update this question |
| 400 | Title cannot be empty |
| 400 | Body cannot be empty |
| 400 | Invalid question ID |

#### DELETE /api/questions/:id (protected, owner-only)

Success: 204 No Content

Errors (as-built):

| Status | Message |
| --- | --- |
| 403 | Not authorized to delete this question |

### 7.4 Answers

#### POST /api/questions/:questionId/answers (protected)

Body:

```json
{ "body": "This is my answer..." }
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 400 | Invalid question ID |
| 400 | Body is required |
| 400 | Body cannot be empty |
| 404 | Question not found |

#### PUT /api/answers/:id (protected, owner-only)

Body:

```json
{ "body": "Updated answer..." }
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 403 | Not authorized to update this answer |
| 400 | Invalid answer ID |
| 400 | Body is required |
| 400 | Body cannot be empty |
| 404 | Answer not found |

#### DELETE /api/answers/:id (protected, owner-only)

Success: 204 No Content

Errors (as-built):

| Status | Message |
| --- | --- |
| 403 | Not authorized to delete this answer |

### 7.5 Votes

#### POST /api/answers/:answerId/vote (protected)

Body:

```json
{ "type": "up" }
```

Rules (locked, as-built):

- one vote per user per answer (unique constraint)
- toggle off on same vote
- switch on opposite vote
- no self-vote (403)

Response (as-built):

```json
{ "voteCount": 3, "userVote": "up" }
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 400 | Invalid answer ID |
| 400 | Vote type is required |
| 400 | Vote type must be either "up" or "down" |
| 403 | Cannot vote on your own answer |
| 404 | Answer not found |

### 7.6 Users

#### GET /api/users?page=1&limit=5 (public)

Behavior (as-built):

- default page=1
- default limit=5
- clamp limit to max 50
- returns lightweight user rows (no emails): id, username, createdAt

Response (as-built):

```json
{
  "items": [
    { "id": 1, "username": "alice", "createdAt": "2026-02-04T12:34:56.789Z" }
  ],
  "page": 1,
  "limit": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

Errors (as-built):

| Status | Message |
| --- | --- |
| 500 | Failed to fetch users |

## 8) Frontend behavior contract (routes, API wiring, selectors)

### 8.1 Routing

Defined in client/src/App.tsx:

| Visibility | Routes |
| --- | --- |
| Public | /register, /login, /users |
| Protected | /questions, /questions/:id (wrapped by ProtectedRoute) |

### 8.2 Auth and storage

localStorage keys:

- token
- user (JSON string)

Axios request interceptor attaches Authorization: Bearer <token>

Axios response interceptor:

- on 401: clears token and user, redirects to /login

### 8.3 API base URL

client/src/services/api.ts sets:

- default: baseURL = "/api" (relies on Vite proxy in client/vite.config.ts)
- override: VITE_API_URL (must include /api, e.g. http://localhost:4000/api)

### 8.4 E2E selector contract (Playwright)

Canonical selector list: client/tests/e2e/helpers/selectors.ts

Examples:

```
global error: data-testid="error-message"
register inputs: register-*-input
login inputs: login-*-input
create question: create-question-*-input, create-question-submit-button
vote: upvote-button, downvote-button, vote-count
logout: logout-button
```

Do not change these IDs without updating Playwright tests.

## 9) Testing (as-built)

### 9.1 Backend tests (Vitest + Supertest + real Postgres)

From repo root: npm run test

- Uses server/tests/setup.ts to reset DB before each test
- Runs serially (see server/vitest.config.ts)
- Requires Postgres running and devqa_test database existing

### 9.2 E2E tests (Playwright)

From repo root: npm run test:e2e

- Playwright config: client/playwright.config.ts
- Automatically starts:
  - backend (waits for http://localhost:4000/health)
  - frontend (waits for http://localhost:5173)
- Uses stable data-testid selectors

## 10) Glassmorphism frontend

**Bold**

```bash
cd worktrees/glassmorphism-bold/client
npm run dev -- --config vite.config.ports.ts
```

**Balanced**

```bash
cd worktrees/glassmorphism-balanced/client
npm run dev -- --config vite.config.ports.ts
```

## 11) Deviations and gotchas (important for reverse-engineering)

### 11.1 Auth response shape mismatches (client vs server)

As-built server:

- POST /api/auth/register returns User only (no token)
- GET /api/auth/verify returns User only (not { user: ... })

As-built client code expects:

- register returns { token, user }
- verify returns { user }

Impact:

- "Register auto-login" and "session persists on refresh" may be flaky/broken until client/server are aligned.

Recommended fixes (choose one):

- Fix server to match canonical contract (return { token, user } on register; wrap verify response), OR
- Fix client to match as-built server (after register -> navigate to /login; parse verify response as user object).

Alignment checklist (minimal changes)

Minimal path is to align the backend to the canonical/client contract (no frontend changes), then update the handful of backend tests that currently assert the old shapes.

- [ ] Backend: Change POST /api/auth/register to return { token, user } (same JWT payload { id, username, email } and expiry 1h as login).
- [ ] Backend: Change GET /api/auth/verify to return { user } (wrap the existing user object).
- [ ] Backend tests: Update server/tests/api/auth.test.ts to assert register returns token + user (and still no password fields).
- [ ] Backend tests: Update server/tests/middleware/auth.test.ts to assert verify returns { user } (and still no password fields).
- [ ] Docs (after implementation): Update §7.2 "As-built response" blocks and mark this deviation resolved.

### 11.2 Monorepo install gotcha

- Root npm install installs only root tooling.
- You must also run npm install --prefix server and npm install --prefix client.

### 11.3 DB password / local Postgres auth

If you see:

```
password authentication failed for user "postgres"
```

Set the correct DB_PASSWORD in server/.env (see server/DATABASE_SETUP.md).

### 11.4 Test DB safety

- DB selection depends on NODE_ENV === "test" in server/src/config/database.ts.
- Ensure you run tests via npm run test so the test DB is used.
- If misconfigured, you can accidentally wipe the dev DB via sequelize.sync({ force: true }) in test setup.

### 11.5 Worktrees are local-only

- worktrees/ is gitignored; it will not exist on a fresh clone unless you create it.
- Do not commit .env, tokens, or worktrees/.

### 11.6 TypeScript safety

- Server dev uses ts-node-dev --transpile-only. Run npm run build --prefix server to catch TS errors.
- Express runtime is 4.x but @types/express is 5.x; if types are confusing, consider aligning.

### 11.7 Do's and don'ts (quick)

Do:

- Keep API base path as /api
- Keep error JSON shape { "error": "..." }
- Keep JWT payload { id, username, email }
- Keep data-testid selectors stable (or update Playwright selectors)

Don't:

- Commit server/.env
- Rename tables away from users/questions/answers/votes
- Remove the pagination clamp (max 50)

## 12) Acceptance checklist (recreateability)

Backend:

- [ ] Register/login works
- [ ] JWT expires and payload includes { id, username, email }
- [ ] Protected routes enforce 401/403 correctly
- [ ] Questions CRUD + ownership checks
- [ ] Answers CRUD + ownership checks
- [ ] Votes toggle/switch/self-vote forbidden
- [ ] Pagination defaults to 10 and clamps at 50
- [ ] Errors always { "error": "..." }

Frontend:

- [ ] /register, /login, /questions, /questions/:id, /users all work
- [ ] Protected routes redirect to /login
- [ ] Errors render in data-testid="error-message"
- [ ] Playwright E2E passes using data-testid selectors

## Appendix A) Key file snapshots (as-built)

These snapshots exist so you can recreate the project "from paper". If these drift from the repo, the repo wins.

### A.1 server/src/app.ts

```ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import questionsRoutes from './routes/questions.routes';
import answersRoutes from './routes/answers.routes';
import votesRoutes from './routes/votes.routes';
import usersRoutes from './routes/users.routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Configure CORS - must allow frontend origin with credentials
// Dev note: we run 3 parallel frontend variants on ports 5173-5175.
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no Origin header) like curl/Invoke-RestMethod.
      if (!origin) return callback(null, true);
      return callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api', answersRoutes);
app.use('/api/answers', votesRoutes);
app.use('/api/users', usersRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Export app for testing (Supertest compatibility)
export default app;
```

### A.2 server/src/controllers/auth.controller.ts (register/login/verify)

```ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

/**
 * Auth Controller
 *
 * Handles authentication endpoints:
 * - User registration
 * - User login
 * - Token verification
 */

/**
 * Register a new user
 *
 * POST /api/auth/register
 *
 * Request Body:
 * - username: string (required)
 * - email: string (required)
 * - password: string (required, min 8 characters)
 *
 * Returns:
 * - 201: User object (without password fields)
 * - 400: Validation error
 * - 409: Duplicate username or email
 * - 500: Server error
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    // Validate password length (minimum 8 characters)
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Create user (password will be hashed by User model hook)
    const user = await User.create({
      username,
      email,
      password
    });

    // Return user object (toJSON removes password_hash)
    res.status(201).json(user.toJSON());
  } catch (error: any) {
    // Handle Sequelize unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      if (field === 'username') {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      if (field === 'email') {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Handle unexpected errors
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login a user
 *
 * POST /api/auth/login
 *
 * Request Body:
 * - email: string (required)
 * - password: string (required)
 *
 * Returns:
 * - 200: JWT token and user object
 * - 400: Missing credentials
 * - 401: Invalid credentials (generic message for security)
 * - 500: Server error
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // If user not found, return generic error (don't reveal if email exists)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password using bcrypt comparison
    const isPasswordValid = await user.validatePassword(password);

    // If password invalid, return generic error (don't reveal if password was wrong)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Generate JWT token with user data and expiry
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      jwtSecret,
      {
        expiresIn: '1h' // CRITICAL: Token must expire
      }
    );

    // Return token and user object (toJSON removes password_hash)
    res.status(200).json({
      token,
      user: user.toJSON()
    });
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify JWT token
 *
 * GET /api/auth/verify
 *
 * Protected endpoint to verify JWT token and return user data
 *
 * Headers:
 * - Authorization: Bearer <token> (required)
 *
 * Returns:
 * - 200: User object from database
 * - 401: Invalid/missing token (handled by middleware)
 * - 404: User not found
 * - 500: Server error
 */
export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch user from database to get latest data
    const user = await User.findByPk(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return user object (toJSON removes password_hash)
    res.status(200).json(user.toJSON());
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### A.3 client/src/services/api.ts

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  Question,
  QuestionDetail,
  CreateQuestionInput,
  UpdateQuestionInput,
  Answer,
  CreateAnswerInput,
  UpdateAnswerInput,
  VoteInput,
  VoteResponse,
  PaginationParams,
  PaginatedResponse,
  ApiError,
} from '@/types';

// Base axios instance
const api = axios.create({
  // Default to same-origin /api (works with Vite dev proxy).
  // Override with VITE_API_URL (e.g. http://localhost:4000/api) when needed.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  verify: async (): Promise<{ user: AuthResponse['user'] }> => {
    const response = await api.get<{ user: AuthResponse['user'] }>('/auth/verify');
    return response.data;
  },
};

// Questions API
export const questionsApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<Question>> => {
    const response = await api.get<PaginatedResponse<Question>>('/questions', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
    });
    return response.data;
  },

  getById: async (id: number): Promise<QuestionDetail> => {
    const response = await api.get<QuestionDetail>(`/questions/${id}`);
    return response.data;
  },

  create: async (data: CreateQuestionInput): Promise<Question> => {
    const response = await api.post<Question>('/questions', data);
    return response.data;
  },

  update: async (id: number, data: UpdateQuestionInput): Promise<Question> => {
    const response = await api.put<Question>(`/questions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },
};

// Answers API
export const answersApi = {
  create: async (questionId: number, data: CreateAnswerInput): Promise<Answer> => {
    const response = await api.post<Answer>(
      `/questions/${questionId}/answers`,
      data
    );
    return response.data;
  },

  update: async (id: number, data: UpdateAnswerInput): Promise<Answer> => {
    const response = await api.put<Answer>(`/answers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/answers/${id}`);
  },
};

// Votes API
export const votesApi = {
  vote: async (answerId: number, data: VoteInput): Promise<VoteResponse> => {
    const response = await api.post<VoteResponse>(
      `/answers/${answerId}/vote`,
      data
    );
    return response.data;
  },
};

// Users API
export const usersApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<{ id: number; username: string; createdAt: string }>> => {
    const response = await api.get<PaginatedResponse<{ id: number; username: string; createdAt: string }>>('/users', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 5,
      },
    });
    return response.data;
  },
};

// Helper to extract error message from API error
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    if (apiError?.error) return apiError.error;

    // If there's no response, it's usually a network issue (backend down) or a CORS/proxy misconfig.
    if (!error.response) {
      return 'Cannot reach the API. Make sure the backend is running on http://localhost:4000 and try again.';
    }

    return error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;
```

### A.4 client/src/context/AuthContext.tsx

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getErrorMessage } from '@/services/api';
import type { User, LoginInput, RegisterInput } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const { user: verifiedUser } = await authApi.verify();
          setUser(verifiedUser);
        } catch (err) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginInput): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.login(data);

      // Store token and user in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authApi.register(data);

      // Store token and user in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setUser(null);
    setError(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```
