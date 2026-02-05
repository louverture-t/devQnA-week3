import { http, HttpResponse } from 'msw';

const API_BASES = ['/api', 'http://localhost:4000/api'];

export const buildApiUrls = (path: string) =>
  API_BASES.map((base) => `${base}${path}`);

// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const mockToken = 'mock-jwt-token-12345';

// Mock questions
const mockQuestions = [
  {
    id: 1,
    title: 'How to test React components?',
    body: 'I want to learn testing...',
    userId: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'What is TypeScript?',
    body: 'Explain TypeScript...',
    userId: 1,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const registerHandler = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as { username: string; email: string; password: string };

  if (!body.username || !body.email || !body.password) {
    return HttpResponse.json(
      { error: 'Username, email, and password are required' },
      { status: 400 }
    );
  }

  if (body.email === 'existing@example.com') {
    return HttpResponse.json(
      { error: 'Email already in use' },
      { status: 409 }
    );
  }

  return HttpResponse.json({
    token: mockToken,
    user: { ...mockUser, username: body.username, email: body.email },
  });
};

const loginHandler = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as { email: string; password: string };

  if (!body.email || !body.password) {
    return HttpResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  if (body.email === 'wrong@example.com') {
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  return HttpResponse.json({
    token: mockToken,
    user: mockUser,
  });
};

const verifyHandler = ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  if (token === 'invalid-token') {
    return HttpResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  return HttpResponse.json({ user: mockUser });
};

const listQuestionsHandler = ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  return HttpResponse.json({
    questions: mockQuestions,
    pagination: {
      page,
      limit,
      totalPages: 1,
      totalCount: mockQuestions.length,
    },
  });
};

const getQuestionHandler = ({ request, params }: { request: Request; params: { id: string } }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const question = mockQuestions.find((q) => q.id === Number(params.id));
  if (!question) {
    return HttpResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    );
  }

  return HttpResponse.json({
    ...question,
    answers: [],
    author: { id: mockUser.id, username: mockUser.username },
  });
};

const createQuestionHandler = async ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { title: string; body: string };

  if (!body.title || !body.body) {
    return HttpResponse.json(
      { error: 'Title and body are required' },
      { status: 400 }
    );
  }

  return HttpResponse.json(
    {
      id: 3,
      title: body.title,
      body: body.body,
      userId: mockUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { status: 201 }
  );
};

const updateQuestionHandler = async ({ request, params }: { request: Request; params: { id: string } }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { title?: string; body?: string };
  const question = mockQuestions.find((q) => q.id === Number(params.id));

  if (!question) {
    return HttpResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    );
  }

  return HttpResponse.json({
    ...question,
    ...body,
    updatedAt: new Date().toISOString(),
  });
};

const deleteQuestionHandler = ({ request, params }: { request: Request; params: { id: string } }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const question = mockQuestions.find((q) => q.id === Number(params.id));
  if (!question) {
    return HttpResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    );
  }

  return new HttpResponse(null, { status: 204 });
};

const createAnswerHandler = async ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { body: string };

  if (!body.body) {
    return HttpResponse.json(
      { error: 'Body is required' },
      { status: 400 }
    );
  }

  return HttpResponse.json(
    {
      id: 1,
      body: body.body,
      userId: mockUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { status: 201 }
  );
};

const updateAnswerHandler = async ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { body: string };

  return HttpResponse.json({
    id: 1,
    body: body.body,
    userId: mockUser.id,
    updatedAt: new Date().toISOString(),
  });
};

const deleteAnswerHandler = ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return new HttpResponse(null, { status: 204 });
};

const voteHandler = async ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { type: 'up' | 'down' };

  return HttpResponse.json({
    upvotes: body.type === 'up' ? 1 : 0,
    downvotes: body.type === 'down' ? 1 : 0,
    userVote: body.type,
  });
};

const listUsersHandler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '5');

  return HttpResponse.json({
    users: [
      { id: 1, username: 'testuser', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, username: 'anotheruser', createdAt: '2026-01-02T00:00:00.000Z' },
    ],
    pagination: { page, limit, totalPages: 1, totalCount: 2 },
  });
};

export const handlers = [
  // Auth endpoints
  ...buildApiUrls('/auth/register').map((url) => http.post(url, registerHandler)),
  ...buildApiUrls('/auth/login').map((url) => http.post(url, loginHandler)),
  ...buildApiUrls('/auth/verify').map((url) => http.get(url, verifyHandler)),
  // Questions endpoints
  ...buildApiUrls('/questions').map((url) => http.get(url, listQuestionsHandler)),
  ...buildApiUrls('/questions/:id').map((url) => http.get(url, getQuestionHandler)),
  ...buildApiUrls('/questions').map((url) => http.post(url, createQuestionHandler)),
  ...buildApiUrls('/questions/:id').map((url) => http.put(url, updateQuestionHandler)),
  ...buildApiUrls('/questions/:id').map((url) => http.delete(url, deleteQuestionHandler)),
  // Answers endpoints
  ...buildApiUrls('/questions/:questionId/answers').map((url) =>
    http.post(url, createAnswerHandler)
  ),
  ...buildApiUrls('/answers/:id').map((url) => http.put(url, updateAnswerHandler)),
  ...buildApiUrls('/answers/:id').map((url) => http.delete(url, deleteAnswerHandler)),
  // Votes endpoint
  ...buildApiUrls('/answers/:answerId/vote').map((url) => http.post(url, voteHandler)),
  // Users endpoint
  ...buildApiUrls('/users').map((url) => http.get(url, listUsersHandler)),
];
