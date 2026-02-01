#Project no.3

# Client-Server Essentials Capstone: DevQ&A Platform

## 🎯 Project Overview

**DevQ&A** is a lightweight Q&A platform for developers - think "Mini Stack Overflow." You'll build a full-stack application where developers can:
- Post coding questions
- Answer questions from other developers
- Upvote helpful answers
- Authenticate with JWT tokens

**What's Already Built:**
✅ Complete React frontend (Vite + React Router + Axios)  
✅ All UI components and pages  
✅ Authentication context and protected routes  
✅ API service layer ready to connect

**What You'll Build (3 Days):**
🔨 Express backend with TypeScript  
🔨 Sequelize models with associations  
🔨 JWT authentication system  
🔨 RESTful API endpoints  
🔨 Protected routes with middleware  

## 📅 3-Day Timeline

### Day 1: Authentication & User Management (6-8 hours)
- Set up Express server with TypeScript
- Create User model with password hashing
- Build register/login endpoints with JWT
- Test authentication flow with Postman
- Connect frontend to auth endpoints

### Day 2: Questions & Answers (6-8 hours)
- Create Question and Answer models with associations
- Build CRUD endpoints for questions
- Build endpoints for answers
- Add JWT middleware to protect routes
- Test complete question/answer flow

### Day 3: Voting System & Polish (4-6 hours)
- Create Vote model with constraints
- Implement upvote/downvote functionality
- Add error handling and validation
- Test full application flow
- Deploy (optional)

## 🗂️ Project Structure

```
capstone/
├── client/                    # ✅ COMPLETE - React frontend
│   ├── src/
│   │   ├── components/       # All UI components ready
│   │   ├── pages/            # All pages implemented
│   │   ├── context/          # Auth context configured
│   │   ├── services/         # API service layer
│   │   └── App.tsx           # Routes configured
│   ├── package.json
│   └── vite.config.ts
│
└── server/                    # 🔨 YOUR WORK - Build this!
    ├── src/
    │   ├── config/
    │   │   └── database.ts   # Database configuration
    │   ├── models/
    │   │   ├── index.ts      # Model exports & associations
    │   │   ├── User.ts       # TODO: Build User model
    │   │   ├── Question.ts   # TODO: Build Question model
    │   │   ├── Answer.ts     # TODO: Build Answer model
    │   │   └── Vote.ts       # TODO: Build Vote model
    │   ├── middleware/
    │   │   └── auth.ts       # TODO: Build JWT middleware
    │   ├── routes/
    │   │   ├── auth.ts       # TODO: Build auth routes
    │   │   ├── questions.ts  # TODO: Build question routes
    │   │   ├── answers.ts    # TODO: Build answer routes
    │   │   └── votes.ts      # TODO: Build vote routes
    │   └── index.ts          # TODO: Set up Express server
    ├── package.json
    ├── tsconfig.json
    └── .env.example

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running
- Postman (for API testing)

### Quick Start (Recommended)

From the Starter directory, run everything with one command:

```bash
# Install all dependencies (server + client)
npm install

# Set up environment variables
cd server
cp .env.example .env
# Edit .env with your database credentials
cd ..

# Create database
createdb devqa

# Start both frontend and backend in development mode
npm run start:dev
```

This will:
- Start the backend server on http://localhost:4000
- Wait for the server to be ready
- Start the frontend on http://localhost:5173
- Both will run concurrently with hot-reload

### Available Scripts

From the **Starter** directory:

- `npm run start:dev` - Run both frontend & backend with hot-reload ⭐ **Recommended**
- `npm run server:dev` - Run backend only
- `npm run client:dev` - Run frontend only
- `npm install` - Install all dependencies
- `npm run build` - Build frontend for production
- `npm start` - Run production server

### Manual Setup (Alternative)

If you prefer to set up each part manually:

**Step 1: Set Up the Database**
```bash
createdb devqa
# Or using psql:
# psql -U postgres
# CREATE DATABASE devqa;
# \q
```

**Step 2: Install Dependencies**
```bash
# Install all at once from Starter directory
npm install

# OR install individually:
cd client && npm install && cd ..
cd server && npm install && cd ..
```

**Step 3: Configure Environment Variables**

Copy and edit the server environment file:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
DB_NAME=devqa
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

PORT=4000
```

**⚠️ IMPORTANT:** Change the `JWT_SECRET` to a strong random string!

**Step 4: Start Development Servers**

**Option A - Run both with one command (Recommended):**
```bash
# From Starter directory
npm run start:dev
```

**Option B - Run separately in two terminals:**

Terminal 1 - Backend:
```bash
cd server
npm run dev
# Backend runs on http://localhost:4000
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

## 📝 Day 1: Authentication & User Management

### Learning Objectives
- Set up Express server with TypeScript
- Create Sequelize models with hooks
- Implement JWT token generation and verification
- Build secure authentication endpoints

### 1.1: Set Up Express Server (30 minutes)

**File:** `server/src/index.ts`

Create the main Express server with:
- Express app initialization
- JSON middleware
- CORS configuration (allow frontend origin)
- Database connection with Sequelize
- Route imports
- Error handling

**Requirements:**
- Import and configure dotenv first
- Use `cors({ origin: 'http://localhost:5173' })` to allow frontend
- Connect to database with `sequelize.authenticate()`
- Sync models with `sequelize.sync()`
- Start server on port from environment

**Testing:**
```bash
npm run dev
# Should see: "✓ Database connected" and "Server running on http://localhost:4000"
```

### 1.2: Create User Model (45 minutes)

**File:** `server/src/models/User.ts`

The User model represents registered users in the system.

**Fields:**
- `id`: INTEGER, primary key, auto-increment
- `username`: STRING(50), unique, not null
  - Validation: 3-20 characters
- `email`: STRING(255), unique, not null
  - Validation: must be valid email
- `password`: STRING(255), not null
  - Validation: min 8 characters (before hashing)
- `createdAt`: DATE (automatic)
- `updatedAt`: DATE (automatic)

**Hooks:**
- `beforeCreate`: Hash password with bcrypt before saving
- `beforeUpdate`: Hash password only if it changed

**Instance Methods:**
- `comparePassword(plainPassword: string): Promise<boolean>` - Compare plain password with hash

**TypeScript Interfaces:**
```typescript
interface UserAttributes {
  id: number
  username: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}
```

**Tips:**
- Import bcrypt: `import bcrypt from 'bcrypt'`
- Get salt rounds from environment: `process.env.BCRYPT_SALT_ROUNDS || '10'`
- Use `user.changed('password')` to check if password was modified
- Return bcrypt.compare() in comparePassword method

### 1.3: Build JWT Middleware (30 minutes)

**File:** `server/src/middleware/auth.ts`

Create middleware to verify JWT tokens and protect routes.

**Function:** `authenticateToken(req, res, next)`

**Steps:**
1. Extract token from Authorization header (`Bearer <token>`)
2. If no token, return 401 error
3. Verify token with `jwt.verify(token, process.env.JWT_SECRET)`
4. Decode payload and attach to `req.user`
5. Call `next()` if valid
6. Handle errors (expired token, invalid token)

**TypeScript:** Extend Express Request interface:
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        email: string
      }
    }
  }
}
```

**Error Responses:**
- No token: `{ error: 'No token provided' }` (401)
- Expired token: `{ error: 'Token expired', message: '...' }` (401)
- Invalid token: `{ error: 'Invalid token', message: '...' }` (401)

### 1.4: Create Authentication Routes (1 hour)

**File:** `server/src/routes/auth.ts`

Create router with two endpoints:

#### POST /api/auth/register
**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Logic:**
1. Validate all fields are present
2. Create user with `User.create()`
3. Remove password from response
4. Return user object

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Handling:**
- Missing fields: 400
- Duplicate email: 409
- Validation errors: 400

#### POST /api/auth/login
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Logic:**
1. Find user by email
2. Verify password with `user.comparePassword()`
3. Generate JWT with `jwt.sign({ userId, email }, secret, { expiresIn })`
4. Return token and user

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Handling:**
- Invalid credentials: 401 (same message for bad email or password)
- Missing fields: 400

### 1.5: Test Authentication Flow (1 hour)

**Postman Tests:**

1. **Register User:**
   ```
   POST http://localhost:4000/api/auth/register
   Body: { username, email, password }
   Expected: 201 with user object (no password)
   ```

2. **Login:**
   ```
   POST http://localhost:4000/api/auth/login
   Body: { email, password }
   Expected: 200 with token
   Save token for next requests!
   ```

3. **Login with Wrong Password:**
   ```
   POST http://localhost:4000/api/auth/login
   Body: { email, "wrongpassword" }
   Expected: 401 error
   ```

4. **Register Duplicate Email:**
   ```
   POST http://localhost:4000/api/auth/register
   Body: { same email }
   Expected: 409 error
   ```

### 1.6: Connect Frontend to Auth (30 minutes)

The frontend auth service is already configured to call your API. Test the UI:

1. Start both servers (client + server)
2. Go to http://localhost:5173
3. Click "Register" and create an account
4. You should be redirected to home page
5. Log out and log back in
6. Token should be stored in localStorage

**If authentication works in the UI, Day 1 is complete! ✅**

---

## 📝 Day 2: Questions & Answers

### Learning Objectives
- Create models with associations (hasMany, belongsTo)
- Build protected CRUD endpoints
- Implement nested resources (questions/:id/answers)
- Test complete data flow

### 2.1: Create Question Model (30 minutes)

**File:** `server/src/models/Question.ts`

**Fields:**
- `id`: INTEGER, primary key, auto-increment
- `title`: STRING(255), not null
  - Validation: 10-255 characters
- `body`: TEXT, not null
  - Validation: min 20 characters
- `userId`: INTEGER, not null (foreign key)
- `createdAt`: DATE
- `updatedAt`: DATE

**TypeScript Interfaces:**
```typescript
interface QuestionAttributes {
  id: number
  title: string
  body: string
  userId: number
  createdAt?: Date
  updatedAt?: Date
}
```

**Associations (add in `models/index.ts`):**
```typescript
// User has many Questions
User.hasMany(Question, { foreignKey: 'userId', as: 'questions' })
Question.belongsTo(User, { foreignKey: 'userId', as: 'author' })
```

### 2.2: Create Answer Model (30 minutes)

**File:** `server/src/models/Answer.ts`

**Fields:**
- `id`: INTEGER, primary key, auto-increment
- `body`: TEXT, not null
  - Validation: min 10 characters
- `questionId`: INTEGER, not null (foreign key)
- `userId`: INTEGER, not null (foreign key)
- `createdAt`: DATE
- `updatedAt`: DATE

**Associations (add in `models/index.ts`):**
```typescript
// Question has many Answers
Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' })
Answer.belongsTo(Question, { foreignKey: 'questionId' })

// User has many Answers
User.hasMany(Answer, { foreignKey: 'userId', as: 'answers' })
Answer.belongsTo(User, { foreignKey: 'userId', as: 'author' })
```

### 2.3: Build Question Routes (1.5 hours)

**File:** `server/src/routes/questions.ts`

#### GET /api/questions
**Description:** Get all questions (public, no auth required)

**Include:**
- Author info (username, id)
- Answer count

**Response:**
```json
{
  "count": 2,
  "questions": [
    {
      "id": 1,
      "title": "What is a closure?",
      "body": "Can someone explain...",
      "createdAt": "2026-01-28T12:00:00.000Z",
      "author": {
        "id": 1,
        "username": "johndoe"
      },
      "answerCount": 3
    }
  ]
}
```

**Hints:**
- Use `include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]`
- Use `attributes: { include: [[sequelize.fn('COUNT', sequelize.col('answers.id')), 'answerCount']] }`

#### GET /api/questions/:id
**Description:** Get single question with all answers

**Include:**
- Author info
- All answers with their authors
- Vote counts for each answer

**Response:**
```json
{
  "id": 1,
  "title": "What is a closure?",
  "body": "Can someone explain closures in JavaScript?",
  "author": {
    "id": 1,
    "username": "johndoe"
  },
  "answers": [
    {
      "id": 1,
      "body": "A closure is...",
      "author": {
        "id": 2,
        "username": "janedoe"
      },
      "voteCount": 5
    }
  ]
}
```

#### POST /api/questions (Protected)
**Description:** Create new question

**Middleware:** `authenticateToken`

**Request:**
```json
{
  "title": "How does async/await work?",
  "body": "I'm confused about how async/await works with promises..."
}
```

**Logic:**
1. Get userId from `req.user.userId`
2. Create question with `Question.create({ ...body, userId })`
3. Return question with author info

#### PUT /api/questions/:id (Protected, Owner Only)
**Description:** Update question

**Logic:**
1. Find question by id
2. Check if `question.userId === req.user.userId`
3. If not owner, return 403 Forbidden
4. Update question
5. Return updated question

#### DELETE /api/questions/:id (Protected, Owner Only)
**Description:** Delete question

**Logic:**
1. Find question
2. Verify ownership
3. Delete question (cascade will delete answers)
4. Return success message

### 2.4: Build Answer Routes (1 hour)

**File:** `server/src/routes/answers.ts`

#### GET /api/questions/:questionId/answers
**Description:** Get all answers for a question

**Include:** Author info, vote counts

#### POST /api/questions/:questionId/answers (Protected)
**Description:** Add answer to question

**Request:**
```json
{
  "body": "Async/await is syntactic sugar over promises..."
}
```

**Logic:**
1. Verify question exists
2. Create answer with questionId and userId
3. Return answer with author info

#### PUT /api/answers/:id (Protected, Owner Only)
**Description:** Update answer

#### DELETE /api/answers/:id (Protected, Owner Only)
**Description:** Delete answer

### 2.5: Update Server Index (15 minutes)

**File:** `server/src/index.ts`

Import and use routes:
```typescript
import authRoutes from './routes/auth'
import questionRoutes from './routes/questions'
import answerRoutes from './routes/answers'

app.use('/api/auth', authRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/answers', answerRoutes)
```

### 2.6: Test Question/Answer Flow (1 hour)

**Postman Tests:**

1. **Create Question:**
   ```
   POST http://localhost:4000/api/questions
   Header: Authorization: Bearer {token}
   Body: { title, body }
   Expected: 201 with question
   ```

2. **Get All Questions:**
   ```
   GET http://localhost:4000/api/questions
   Expected: 200 with array of questions
   ```

3. **Add Answer:**
   ```
   POST http://localhost:4000/api/questions/1/answers
   Header: Authorization: Bearer {token}
   Body: { body }
   Expected: 201 with answer
   ```

4. **Get Question with Answers:**
   ```
   GET http://localhost:4000/api/questions/1
   Expected: 200 with question and answers array
   ```

### 2.7: Test Frontend Integration (30 minutes)

1. Navigate to http://localhost:5173
2. Login with your account
3. Click "Ask Question"
4. Fill out form and submit
5. Question should appear in list
6. Click on question
7. Add an answer
8. Answer should appear immediately

**If you can create questions and answers in the UI, Day 2 is complete! ✅**

---

## 📝 Day 3: Voting System & Polish

### Learning Objectives
- Create models with composite unique constraints
- Implement voting logic with business rules
- Handle edge cases and validation
- Polish the complete application

### 3.1: Create Vote Model (45 minutes)

**File:** `server/src/models/Vote.ts`

**Fields:**
- `id`: INTEGER, primary key, auto-increment
- `answerId`: INTEGER, not null (foreign key)
- `userId`: INTEGER, not null (foreign key)
- `type`: ENUM('up', 'down'), not null

**Constraints:**
- Unique combination of (answerId, userId) - one vote per user per answer

**Associations (in `models/index.ts`):**
```typescript
// Answer has many Votes
Answer.hasMany(Vote, { foreignKey: 'answerId', as: 'votes' })
Vote.belongsTo(Answer, { foreignKey: 'answerId' })

// User has many Votes
User.hasMany(Vote, { foreignKey: 'userId', as: 'votes' })
Vote.belongsTo(User, { foreignKey: 'userId', as: 'voter' })
```

**Model Definition:**
```typescript
Vote.init({
  // ... fields
}, {
  sequelize,
  tableName: 'votes',
  indexes: [
    {
      unique: true,
      fields: ['answerId', 'userId']
    }
  ]
})
```

### 3.2: Build Vote Routes (1 hour)

**File:** `server/src/routes/votes.ts`

#### POST /api/answers/:answerId/vote (Protected)
**Description:** Upvote or downvote an answer

**Request:**
```json
{
  "type": "up"  // or "down"
}
```

**Logic:**
1. Verify answer exists
2. Check if user already voted on this answer
3. If existing vote:
   - If same type: Remove vote (toggle off)
   - If different type: Update vote type
4. If no existing vote: Create new vote
5. Return updated vote count

**Response:**
```json
{
  "message": "Vote recorded",
  "voteCount": 5,
  "userVote": "up"
}
```

**Business Rules:**
- User cannot vote on their own answer (403 error)
- Vote type must be 'up' or 'down' (400 error)
- One vote per user per answer

#### DELETE /api/answers/:answerId/vote (Protected)
**Description:** Remove vote from answer

### 3.3: Update Answer Routes with Vote Counts (30 minutes)

Modify the answer queries to include:
- Total vote count: `(upvotes - downvotes)`
- User's current vote (if authenticated)

**Example Query:**
```typescript
const answers = await Answer.findAll({
  include: [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username']
    },
    {
      model: Vote,
      as: 'votes',
      attributes: []
    }
  ],
  attributes: {
    include: [
      [
        sequelize.literal(`
          (SELECT COUNT(*) FROM votes WHERE votes.answerId = Answer.id AND votes.type = 'up')
          -
          (SELECT COUNT(*) FROM votes WHERE votes.answerId = Answer.id AND votes.type = 'down')
        `),
        'voteCount'
      ]
    ]
  }
})
```

### 3.4: Add Validation & Error Handling (1 hour)

Add comprehensive validation to all routes:

**User Input Validation:**
- Email format validation
- Password strength requirements
- Title/body length constraints
- Vote type enum validation

**Error Messages:**
Make error messages helpful:
```typescript
if (!title || !body) {
  return res.status(400).json({
    error: 'Validation failed',
    details: {
      title: !title ? 'Title is required' : undefined,
      body: !body ? 'Body is required' : undefined
    }
  })
}
```

**Common Error Scenarios:**
- 400: Bad Request (validation failed)
- 401: Unauthorized (no token or invalid token)
- 403: Forbidden (not the owner)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate email, unique constraint)
- 500: Server Error (catch-all)

### 3.5: Add Seed Data (30 minutes)

Create a seed script to populate the database with sample data:

**File:** `server/src/seed.ts`

```typescript
import { sequelize, User, Question, Answer, Vote } from './models'

async function seed() {
  await sequelize.sync({ force: true })
  
  // Create users
  const users = await User.bulkCreate([
    { username: 'alice', email: 'alice@dev.com', password: 'password123' },
    { username: 'bob', email: 'bob@dev.com', password: 'password123' },
    { username: 'charlie', email: 'charlie@dev.com', password: 'password123' }
  ])
  
  // Create questions
  const questions = await Question.bulkCreate([
    {
      title: 'What is a closure in JavaScript?',
      body: 'I keep hearing about closures but I don\'t understand what they are...',
      userId: users[0].id
    },
    {
      title: 'How does async/await work?',
      body: 'Can someone explain async/await and how it relates to promises?',
      userId: users[1].id
    }
  ])
  
  // Create answers
  const answers = await Answer.bulkCreate([
    {
      body: 'A closure is when a function retains access to variables from its outer scope...',
      questionId: questions[0].id,
      userId: users[1].id
    },
    {
      body: 'Async/await is syntactic sugar for working with promises...',
      questionId: questions[1].id,
      userId: users[0].id
    }
  ])
  
  // Create votes
  await Vote.bulkCreate([
    { answerId: answers[0].id, userId: users[0].id, type: 'up' },
    { answerId: answers[0].id, userId: users[2].id, type: 'up' },
    { answerId: answers[1].id, userId: users[1].id, type: 'up' }
  ])
  
  console.log('✓ Database seeded successfully')
  process.exit(0)
}

seed()
```

**Add to package.json:**
```json
"scripts": {
  "seed": "ts-node src/seed.ts"
}
```

**Run:** `npm run seed`

### 3.6: Test Complete Application (1 hour)

**Full Flow Test:**

1. **Register** a new user
2. **Login** to get token
3. **Create** a question
4. **View** question list (your question appears)
5. **Click** on your question
6. **Add** an answer to your question
7. **Upvote** the answer
8. **Edit** your question
9. **Delete** an answer
10. **Logout** and login as different user
11. **Try** to edit someone else's question (should fail)

**Frontend Testing:**
1. Navigate through all pages
2. Test all forms
3. Verify protected routes redirect to login
4. Check that votes update immediately
5. Confirm error messages display properly

### 3.7: Polish & Deploy (Optional, 1-2 hours)

**Code Quality:**
- Add comments to complex logic
- Extract repeated code into helper functions
- Ensure consistent error handling

**Performance:**
- Add database indexes
- Optimize queries (limit, pagination)
- Enable compression middleware

**Security:**
- Verify all passwords are hashed
- Check all protected routes have middleware
- Validate all user input
- Use parameterized queries (Sequelize does this)

**Deploy (Optional):**
- Backend: Render or Railway
- Frontend: Vercel or Netlify
- Database: Render PostgreSQL or Supabase

---

## 🎯 Assessment Rubric

### Functionality (60 points)
- [ ] User can register and login (10 pts)
- [ ] JWT authentication works (10 pts)
- [ ] Users can create questions (10 pts)
- [ ] Users can post answers (10 pts)
- [ ] Users can vote on answers (10 pts)
- [ ] Protected routes work correctly (10 pts)

### Code Quality (20 points)
- [ ] Models have proper associations (5 pts)
- [ ] Validation on all inputs (5 pts)
- [ ] Error handling on all routes (5 pts)
- [ ] Code is well-organized and commented (5 pts)

### Security (10 points)
- [ ] Passwords are hashed with bcrypt (5 pts)
- [ ] JWT tokens expire (5 pts)

### User Experience (10 points)
- [ ] Frontend connects to backend (5 pts)
- [ ] Error messages are displayed (5 pts)

**Total: 100 points**

---

## 🆘 Troubleshooting

### Database Issues

**Error: "relation does not exist"**
- Run `sequelize.sync({ force: true })` to recreate tables
- Or restart server (sync runs on startup)

**Error: "database does not exist"**
- Create database: `createdb devqa` or use psql

### Authentication Issues

**Error: "No token provided"**
- Check Authorization header format: `Bearer <token>`
- Verify token is being sent from frontend

**Error: "Invalid token"**
- Token might be expired
- Login again to get fresh token
- Check JWT_SECRET matches between creation and verification

### CORS Issues

**Error: "blocked by CORS policy"**
- Add cors middleware: `app.use(cors({ origin: 'http://localhost:5173' }))`
- Restart server after changes

### Frontend Not Connecting

**Check:**
1. Backend server is running on port 4000
2. Frontend is configured to call `http://localhost:4000`
3. CORS is enabled
4. Network tab shows API calls being made

---

## 🎓 Learning Resources

### Sequelize
- [Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)
- [Model Hooks](https://sequelize.org/docs/v6/other-topics/hooks/)
- [Validations](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/)

### JWT
- [JWT.io](https://jwt.io) - Decode tokens
- [jsonwebtoken docs](https://github.com/auth0/node-jsonwebtoken)

### Express
- [Routing Guide](https://expressjs.com/en/guide/routing.html)
- [Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

## 🏆 Stretch Goals

If you finish early, try these extensions:

1. **Tags/Categories:**
   - Add Tag model
   - Many-to-many with Questions
   - Filter questions by tag

2. **Search:**
   - Search questions by title/body
   - Use Sequelize `Op.iLike` operator

3. **Pagination:**
   - Limit results per page
   - Add page navigation

4. **User Profiles:**
   - Display user's questions/answers
   - Show reputation points

5. **Comments:**
   - Add Comment model
   - Comments on questions/answers



---

## ✅ Submission Checklist

Before submitting, ensure:
- [ ] All models created with associations
- [ ] All routes implemented and tested
- [ ] Authentication works (register/login)
- [ ] Protected routes require valid JWT
- [ ] Frontend connects to backend
- [ ] You can complete the full flow test
- [ ] Code is pushed to GitHub
- [ ] README explains how to run project

---

## 🎉 Congratulations!

You've built a full-stack Q&A platform with:
- ✅ Secure JWT authentication
- ✅ Complex data relationships
- ✅ Protected API endpoints
- ✅ Interactive React frontend
- ✅ Real-world voting system

This project showcases everything you've learned about building modern web applications. Add it to your portfolio!

**Good luck! 🚀**