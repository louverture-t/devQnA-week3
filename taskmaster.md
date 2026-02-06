# Taskmaster - DevQ&A Platform Implementation

1. [x] Bootstrap root tooling and scripts
    - [x] Add root package.json scripts per PRD
    - [x] Add start-dev.js for Windows-safe dev startup
    - [x] Add open-report.js for Playwright reports

2. [x] Initialize backend project structure
    - [x] Create server/src entrypoints (app.ts, index.ts)
    - [x] Add env setup and .env.example
    - [x] Configure CORS allowlist and /health endpoint

3. [x] Configure Sequelize and Postgres
    - [x] Implement server/src/config/database.ts with dev/test DB switching
    - [x] Add sync retry for Postgres catalog race
    - [x] Wire sequelize.sync() on startup (capstone mode)

4. [x] Build Sequelize models and associations
    - [x] Define users, questions, answers, votes models
    - [x] Map FK fields to snake_case via field option
    - [x] Enforce unique constraint on (answer_id, user_id)

5. [x] Implement auth flow
    - [x] Add JWT issuance on login with 1h expiry
    - [x] Add register and verify endpoints per PRD
    - [x] Add auth middleware attaching req.user

6. [x] Implement questions API
    - [x] CRUD endpoints for questions
    - [x] Pagination with page/limit and max 50
    - [x] Ensure error responses use {"error":"..."}

7. [x] Implement answers API
    - [x] CRUD endpoints for answers scoped to questions
    - [x] Enforce author-only edits/deletes
    - [x] Return consistent DTO shapes

8. [x] Implement voting API
    - [x] Add /api/answers/:answerId/vote
    - [x] Enforce one vote per user and toggle/switch logic
    - [x] Block voting on own answers (403)

9. [x] Implement users API
    - [x] Add /api/users routes
    - [x] Return public user data only
    - [x] Validate route protections

10. [x] Add backend tests (Vitest + Supertest)
    - [x] Configure vitest to run serially
    - [x] Add test setup to truncate DB before each test
    - [x] Create API tests for auth/questions/answers/votes (users + votes done)

11. [x] Scaffold frontend app
    - [x] Create Vite React TS app in client/
    - [x] Add Tailwind and global styles
    - [x] Add basic layout shell and nav

12. [x] Implement frontend auth and API services
    - [x] Build api.ts with baseURL and interceptors
    - [x] Add AuthContext for login/logout and storage
    - [x] Protect routes with ProtectedRoute

13. [ ] Implement pages and E2E tests
    - [x] Build Register, Login, Questions List/Detail, Users pages
    - [x] Wire Q&A CRUD and voting UI
    - [ ] Add Playwright tests and selectors per PRD
