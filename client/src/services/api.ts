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
      // Only clear token and redirect if the user had a token (was logged in)
      const hadToken = localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (hadToken && window.location.pathname !== '/login') {
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
