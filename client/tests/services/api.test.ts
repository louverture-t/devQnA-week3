import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { buildApiUrls } from '../mocks/handlers';
import { http, HttpResponse } from 'msw';

// These tests are written TDD-style BEFORE implementation
// They import from @/services/api which will be created after tests
import {
  authApi,
  questionsApi,
  answersApi,
  votesApi,
  usersApi,
  getErrorMessage,
} from '@/services/api';

describe('API Service', () => {
  describe('Request Interceptor', () => {
    it('attaches Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('token', 'test-jwt-token');

      const response = await questionsApi.list();

      expect(response.pagination).toBeDefined();
    });

    it('does not attach Authorization header when no token exists', async () => {
      localStorage.removeItem('token');

      // This should fail with 401 because no token is passed
      await expect(questionsApi.list()).rejects.toThrow();
    });
  });

  describe('Response Interceptor', () => {
    it('clears localStorage and redirects on 401 response', async () => {
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      window.location.pathname = '/questions';

      // Override handler to return 401
      server.use(
        ...buildApiUrls('/questions').map((url) =>
          http.get(url, () => {
            return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
          })
        )
      );

      await expect(questionsApi.list()).rejects.toThrow();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('does not redirect if already on login page', async () => {
      localStorage.setItem('token', 'invalid-token');
      window.location.pathname = '/login';

      server.use(
        ...buildApiUrls('/questions').map((url) =>
          http.get(url, () => {
            return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
          })
        )
      );

      await expect(questionsApi.list()).rejects.toThrow();

      // Should not redirect (window.location.href should not be called)
      expect(window.location.href).toBe('http://localhost:5173/');
    });
  });

  describe('authApi', () => {
    describe('register', () => {
      it('sends registration data and returns token + user', async () => {
        const input = {
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        };

        const response = await authApi.register(input);

        expect(response.token).toBe('mock-jwt-token-12345');
        expect(response.user.username).toBe('newuser');
        expect(response.user.email).toBe('new@example.com');
      });

      it('throws error for duplicate email', async () => {
        const input = {
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123',
        };

        await expect(authApi.register(input)).rejects.toThrow();
      });
    });

    describe('login', () => {
      it('sends login credentials and returns token + user', async () => {
        const input = {
          email: 'test@example.com',
          password: 'password123',
        };

        const response = await authApi.login(input);

        expect(response.token).toBe('mock-jwt-token-12345');
        expect(response.user.id).toBe(1);
        expect(response.user.username).toBe('testuser');
      });

      it('throws error for invalid credentials', async () => {
        const input = {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        };

        await expect(authApi.login(input)).rejects.toThrow();
      });
    });

    describe('verify', () => {
      it('verifies token and returns user', async () => {
        localStorage.setItem('token', 'valid-token');

        const response = await authApi.verify();

        expect(response.user.id).toBe(1);
        expect(response.user.username).toBe('testuser');
      });

      it('throws error for invalid token', async () => {
        localStorage.setItem('token', 'invalid-token');

        server.use(
          ...buildApiUrls('/auth/verify').map((url) =>
            http.get(url, () => {
              return HttpResponse.json({ error: 'Invalid token' }, { status: 401 });
            })
          )
        );

        await expect(authApi.verify()).rejects.toThrow();
      });
    });
  });

  describe('questionsApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('list', () => {
      it('fetches paginated questions', async () => {
        const response = await questionsApi.list({ page: 1, limit: 10 });

        expect(response.questions).toHaveLength(2);
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.limit).toBe(10);
      });

      it('uses default pagination when not specified', async () => {
        const response = await questionsApi.list();

        expect(response.pagination.page).toBe(1);
        expect(response.pagination.limit).toBe(10);
      });
    });

    describe('getById', () => {
      it('fetches a single question with details', async () => {
        const response = await questionsApi.getById(1);

        expect(response.id).toBe(1);
        expect(response.title).toBe('How to test React components?');
        expect(response.answers).toBeDefined();
        expect(response.author).toBeDefined();
      });

      it('throws error for non-existent question', async () => {
        await expect(questionsApi.getById(999)).rejects.toThrow();
      });
    });

    describe('create', () => {
      it('creates a new question', async () => {
        const input = {
          title: 'New Question',
          body: 'Question body text',
        };

        const response = await questionsApi.create(input);

        expect(response.id).toBe(3);
        expect(response.title).toBe('New Question');
        expect(response.body).toBe('Question body text');
      });
    });

    describe('update', () => {
      it('updates an existing question', async () => {
        const response = await questionsApi.update(1, { title: 'Updated Title' });

        expect(response.title).toBe('Updated Title');
      });
    });

    describe('delete', () => {
      it('deletes a question', async () => {
        await expect(questionsApi.delete(1)).resolves.toBeUndefined();
      });
    });
  });

  describe('answersApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('create', () => {
      it('creates an answer for a question', async () => {
        const response = await answersApi.create(1, { body: 'My answer' });

        expect(response.id).toBe(1);
        expect(response.body).toBe('My answer');
      });
    });

    describe('update', () => {
      it('updates an existing answer', async () => {
        const response = await answersApi.update(1, { body: 'Updated answer' });

        expect(response.body).toBe('Updated answer');
      });
    });

    describe('delete', () => {
      it('deletes an answer', async () => {
        await expect(answersApi.delete(1)).resolves.toBeUndefined();
      });
    });
  });

  describe('votesApi', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-token');
    });

    describe('vote', () => {
      it('casts an upvote', async () => {
        const response = await votesApi.vote(1, { type: 'up' });

        expect(response.upvotes).toBe(1);
        expect(response.downvotes).toBe(0);
        expect(response.userVote).toBe('up');
      });

      it('casts a downvote', async () => {
        const response = await votesApi.vote(1, { type: 'down' });

        expect(response.upvotes).toBe(0);
        expect(response.downvotes).toBe(1);
        expect(response.userVote).toBe('down');
      });
    });
  });

  describe('usersApi', () => {
    describe('list', () => {
      it('fetches paginated users', async () => {
        const response = await usersApi.list({ page: 1, limit: 5 });

        expect(response.users).toHaveLength(2);
        expect(response.pagination.page).toBe(1);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('extracts error message from API error response', async () => {
      server.use(
        ...buildApiUrls('/auth/login').map((url) =>
          http.post(url, () => {
            return HttpResponse.json({ error: 'Custom error message' }, { status: 400 });
          })
        )
      );

      try {
        await authApi.login({ email: 'test@example.com', password: 'wrong' });
      } catch (err) {
        const message = getErrorMessage(err);
        expect(message).toBe('Custom error message');
      }
    });

    it('returns generic message for unknown errors', () => {
      const message = getErrorMessage('unknown error');
      expect(message).toBe('An unexpected error occurred');
    });

    it('returns error message from Error instances', () => {
      const message = getErrorMessage(new Error('Test error'));
      expect(message).toBe('Test error');
    });

    it('returns network error message when no response', async () => {
      server.use(
        ...buildApiUrls('/auth/login').map((url) =>
          http.post(url, () => {
            return HttpResponse.error();
          })
        )
      );

      try {
        await authApi.login({ email: 'test@example.com', password: 'test' });
      } catch (err) {
        const message = getErrorMessage(err);
        expect(message).toContain('Cannot reach the API');
      }
    });
  });
});
