// User types
export interface User {
  id: number;
  username: string;
  email: string;
}

// Auth types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Question types
export interface Question {
  id: number;
  title: string;
  body: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
  };
}

export interface QuestionDetail extends Question {
  answers: Answer[];
  author: {
    id: number;
    username: string;
  };
}

export interface CreateQuestionInput {
  title: string;
  body: string;
}

export interface UpdateQuestionInput {
  title?: string;
  body?: string;
}

// Answer types
export interface Answer {
  id: number;
  body: string;
  questionId?: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
  author?: {
    id: number;
    username: string;
  };
}

export interface CreateAnswerInput {
  body: string;
}

export interface UpdateAnswerInput {
  body: string;
}

// Vote types
export interface VoteInput {
  type: 'up' | 'down';
}

export interface VoteResponse {
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// API Error type
export interface ApiError {
  error: string;
}
