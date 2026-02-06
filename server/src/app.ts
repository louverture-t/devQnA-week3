import cors from "cors";
import express, { type Request, type Response } from "express";

import answersRoutes from "./routes/answers";
import authRoutes from "./routes/auth";
import questionsRoutes from "./routes/questions";
import usersRoutes from "./routes/users";
import votesRoutes from "./routes/votes";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api", answersRoutes);
app.use("/api/answers", votesRoutes);
app.use("/api/users", usersRoutes);

app.use((err: Error, req: Request, res: Response, next: () => void) => {
  if (res.headersSent) {
    next();
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

export default app;
