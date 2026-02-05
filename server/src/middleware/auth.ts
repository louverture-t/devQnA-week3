import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as {
      id: number;
      username: string;
      email: string;
    };

    req.user = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ error: "Token expired", message: error.message });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token", message: error.message });
      return;
    }

    res.status(401).json({ error: "Invalid token" });
  }
};
