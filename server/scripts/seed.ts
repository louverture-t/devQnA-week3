import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const USERS = [
  { username: "dkole", email: "dkole@example.com", password: "m1sieroro" },
  { username: "janedoe", email: "jane@example.com", password: "password123" },
  { username: "bobsmith", email: "bob@example.com", password: "password123" },
];

const QUESTIONS = [
  {
    title: "How do I center a div in CSS?",
    body: "I've been trying to center a div both vertically and horizontally inside a parent container. I've tried using margin: auto and text-align: center but nothing seems to work consistently. What is the modern best practice?",
    userIndex: 0,
  },
  {
    title: "What is the difference between let, const, and var in JavaScript?",
    body: "I keep seeing all three used in different codebases. I understand var is older, but when should I use let vs const? Are there performance differences or is it purely about intent and scoping rules?",
    userIndex: 1,
  },
  {
    title: "How to handle async errors in Express middleware?",
    body: "My Express routes use async/await but when an async function throws, Express doesn't catch it and the server hangs. I've read about wrapper functions but I'm not sure what the cleanest approach is. Any recommendations?",
    userIndex: 2,
  },
  {
    title: "Why does useEffect run twice in React 18 development mode?",
    body: "I upgraded to React 18 and noticed my useEffect cleanup and setup functions run twice on mount in development. This is causing duplicate API calls and confusing behavior. Is this a bug or intentional? How do I handle it properly?",
    userIndex: 0,
  },
  {
    title: "Best way to structure a Node.js REST API project?",
    body: "I'm starting a new backend project with Express and TypeScript. I want to follow best practices for folder structure, separation of concerns, and testability. What patterns do experienced developers recommend for medium-to-large scale APIs?",
    userIndex: 1,
  },
];

const ANSWERS = [
  {
    questionIndex: 0,
    userIndex: 1,
    body: "The easiest modern approach is Flexbox. On the parent container, set display: flex; justify-content: center; align-items: center; and give it a height. This centers the child both horizontally and vertically.",
  },
  {
    questionIndex: 0,
    userIndex: 2,
    body: "You can also use CSS Grid: display: grid; place-items: center; on the parent. It's even shorter than Flexbox and works great for single-child centering scenarios.",
  },
  {
    questionIndex: 1,
    userIndex: 0,
    body: "Use const by default for every variable. Only switch to let when you genuinely need to reassign the value (like a loop counter or accumulator). Never use var — it has function scoping instead of block scoping, which leads to subtle bugs.",
  },
  {
    questionIndex: 1,
    userIndex: 2,
    body: "There's no performance difference between let and const in modern engines. The distinction is about developer intent: const signals the binding won't change, making code easier to reason about during reviews.",
  },
  {
    questionIndex: 2,
    userIndex: 0,
    body: "Create a simple wrapper: const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); Then wrap your route handlers: router.get('/path', asyncHandler(async (req, res) => { ... }));",
  },
  {
    questionIndex: 2,
    userIndex: 1,
    body: "Starting with Express 5 (currently in beta), async errors are automatically caught and forwarded to error-handling middleware. If you can upgrade, that's the cleanest solution with zero boilerplate.",
  },
  {
    questionIndex: 3,
    userIndex: 1,
    body: "This is intentional in React 18 Strict Mode. It mounts, unmounts, then re-mounts your component to help you find missing cleanup logic. It only happens in development. Make sure your effects have proper cleanup functions and are idempotent.",
  },
  {
    questionIndex: 3,
    userIndex: 2,
    body: "To avoid duplicate API calls, use an AbortController in your useEffect cleanup: const controller = new AbortController(); fetch(url, { signal: controller.signal }); return () => controller.abort(); This properly cancels the first request.",
  },
  {
    questionIndex: 4,
    userIndex: 0,
    body: "I recommend: src/routes/ for route definitions, src/controllers/ for request handling logic, src/services/ for business logic, src/models/ for data models, src/middleware/ for auth/validation, and src/config/ for environment config. Keep each layer focused on one responsibility.",
  },
  {
    questionIndex: 4,
    userIndex: 2,
    body: "The most important thing is separating your business logic from Express. Your services should be framework-agnostic — they take plain data and return plain data. This makes testing trivial and lets you swap frameworks later if needed.",
  },
];

const VOTES: { answerIndex: number; userIndex: number; type: "up" | "down" }[] = [
  { answerIndex: 0, userIndex: 0, type: "up" },
  { answerIndex: 0, userIndex: 2, type: "up" },
  { answerIndex: 1, userIndex: 0, type: "up" },
  { answerIndex: 2, userIndex: 1, type: "up" },
  { answerIndex: 2, userIndex: 2, type: "up" },
  { answerIndex: 4, userIndex: 1, type: "up" },
  { answerIndex: 4, userIndex: 2, type: "up" },
  { answerIndex: 6, userIndex: 0, type: "up" },
  { answerIndex: 6, userIndex: 2, type: "up" },
  { answerIndex: 8, userIndex: 1, type: "up" },
  { answerIndex: 8, userIndex: 2, type: "up" },
  { answerIndex: 9, userIndex: 0, type: "up" },
];

const main = async (): Promise<void> => {
  const { sequelize, syncDatabase } = await import("../src/config/database");
  const { User, Question, Answer, Vote } = await import("../src/models");

  try {
    await sequelize.authenticate();
    await syncDatabase();

    // Clear existing data (in reverse dependency order)
    await Vote.destroy({ where: {} });
    await Answer.destroy({ where: {} });
    await Question.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log("[devqa] cleared existing data");

    // Seed users
    const createdUsers = [];
    for (const u of USERS) {
      const user = await User.create(u);
      createdUsers.push(user);
      console.log(`[devqa] created user: ${u.username} (${u.email})`);
    }

    // Seed questions
    const createdQuestions = [];
    for (const q of QUESTIONS) {
      const question = await Question.create({
        title: q.title,
        body: q.body,
        userId: createdUsers[q.userIndex].id,
      });
      createdQuestions.push(question);
      console.log(`[devqa] created question: "${q.title.slice(0, 50)}..."`);
    }

    // Seed answers
    const createdAnswers = [];
    for (const a of ANSWERS) {
      const answer = await Answer.create({
        body: a.body,
        questionId: createdQuestions[a.questionIndex].id,
        userId: createdUsers[a.userIndex].id,
      });
      createdAnswers.push(answer);
      console.log(`[devqa] created answer for question #${a.questionIndex + 1} by ${USERS[a.userIndex].username}`);
    }

    // Seed votes
    for (const v of VOTES) {
      await Vote.create({
        answerId: createdAnswers[v.answerIndex].id,
        userId: createdUsers[v.userIndex].id,
        type: v.type,
      });
    }
    console.log(`[devqa] created ${VOTES.length} votes`);

    console.log("\n[devqa] seed complete!");
    console.log(`  ${createdUsers.length} users`);
    console.log(`  ${createdQuestions.length} questions`);
    console.log(`  ${createdAnswers.length} answers`);
    console.log(`  ${VOTES.length} votes`);
    console.log("\n[devqa] login credentials:");
    for (const u of USERS) {
      console.log(`  ${u.email} / ${u.password}`);
    }
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error("[devqa] seed failed", error);
  process.exitCode = 1;
});
