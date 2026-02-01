# 🗂️ Project Structure

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