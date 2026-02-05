# Taskmaster - DevQ&A Platform Implementation

1. [ ] Bootstrap root tooling and scripts
   - [ ] Add root package.json scripts per PRD
   - [ ] Add start-dev.js for Windows-safe dev startup
   - [ ] Add open-report.js for Playwright reports

2. [ ] Initialize backend project structure
   - [ ] Create server/src entrypoints (app.ts, index.ts)
   - [ ] Add env setup and .env.example
   - [ ] Configure CORS allowlist and /health endpoint

3. [ ] Configure Sequelize and Postgres
   - [ ] Implement server/src/config/database.ts with dev/test DB switching
   - [ ] Add sync retry for Postgres catalog race
   - [ ] Wire sequelize.sync() on startup (capstone mode)

4. [ ] Build Sequelize models and associations
   - [ ] Define users, questions, answers, votes models
   - [ ] Map FK fields to snake_case via field option
   - [ ] Enforce unique constraint on (answer_id, user_id)

5. [ ] Implement auth flow
   - [ ] Add JWT issuance on login with 1h expiry
   - [ ] Add register and verify endpoints per PRD
   - [ ] Add auth middleware attaching req.user

6. [ ] Implement questions API
   - [ ] CRUD endpoints for questions
   - [ ] Pagination with page/limit and max 50
   - [ ] Ensure error responses use {"error":"..."}

7. [ ] Implement answers API
   - [ ] CRUD endpoints for answers scoped to questions
   - [ ] Enforce author-only edits/deletes
   - [ ] Return consistent DTO shapes

8. [ ] Implement voting API
   - [ ] Add /api/answers/:answerId/vote
   - [ ] Enforce one vote per user and toggle/switch logic
   - [ ] Block voting on own answers (403)

9. [ ] Implement users API
   - [ ] Add /api/users routes
   - [ ] Return public user data only
   - [ ] Validate route protections

10. [ ] Add backend tests (Vitest + Supertest)
    - [ ] Configure vitest to run serially
    - [ ] Add test setup to truncate DB before each test
    - [ ] Create API tests for auth/questions/answers/votes

11. [ ] Scaffold frontend app
    - [ ] Create Vite React TS app in client/
    - [ ] Add Tailwind and global styles
    - [ ] Add basic layout shell and nav

12. [ ] Implement frontend auth and API services
    - [ ] Build api.ts with baseURL and interceptors
    - [ ] Add AuthContext for login/logout and storage
    - [ ] Protect routes with ProtectedRoute

13. [ ] Implement pages and E2E tests
    - [ ] Build Register, Login, Questions List/Detail, Users pages
    - [ ] Wire Q&A CRUD and voting UI
    - [ ] Add Playwright tests and selectors per PRD
