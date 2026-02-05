/// <reference types="vitest" />

import request from "supertest";

let app: typeof import("../../src/app").default;

type AuthResponse = {
	token: string;
	user: { id: number; username: string; email: string };
};

type QuestionResponse = {
	id: number;
	title: string;
	body: string;
	userId: number;
	user: { id: number; username: string } | null;
	createdAt: string;
	updatedAt: string;
};

type QuestionsListResponse = {
	items: QuestionResponse[];
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
};

const registerUser = async (payload: {
	username: string;
	email: string;
	password: string;
}): Promise<AuthResponse> => {
	const res = await request(app).post("/api/auth/register").send(payload);
	return res.body as AuthResponse;
};

const alice = { username: "alice", email: "alice@example.com", password: "password123" };
const bob = { username: "bob", email: "bob@example.com", password: "password123" };

const sampleQuestion = { title: "What is TDD?", body: "Explain test-driven development." };

describe("Questions API", () => {
	beforeAll(async () => {
		app = (await import("../../src/app")).default;
	});

	// ─── GET /api/questions (list) ─────────────────────────────────────

	describe("GET /api/questions", () => {
		it("returns an empty list when no questions exist", async () => {
			const res = await request(app).get("/api/questions");

			expect(res.status).toBe(200);

			const body = res.body as QuestionsListResponse;
			expect(body.items).toEqual([]);
			expect(body.totalItems).toBe(0);
			expect(body.page).toBe(1);
		});

		it("returns paginated questions with author info", async () => {
			const { token } = await registerUser(alice);

			// Seed 3 questions and verify each was created
			for (let i = 1; i <= 3; i++) {
				const created = await request(app)
					.post("/api/questions")
					.set("Authorization", `Bearer ${token}`)
					.send({
						title: `Question title ${i}`,
						body: `Question body content for item ${i} goes here.`,
					});
				expect(created.status).toBe(201);
			}

			const res = await request(app).get("/api/questions?page=1&limit=2");

			expect(res.status).toBe(200);

			const body = res.body as QuestionsListResponse;
			expect(body.items.length).toBe(2);
			expect(body.totalItems).toBe(3);
			expect(body.totalPages).toBe(2);
			expect(body.page).toBe(1);
			expect(body.limit).toBe(2);
			// Should include author
			expect(body.items[0].user).toEqual(
				expect.objectContaining({ id: expect.any(Number), username: "alice" })
			);
		});

		it("caps limit at 50", async () => {
			const res = await request(app)
				.get("/api/questions")
				.query({ limit: 999 });

			expect(res.status).toBe(200);
			expect((res.body as QuestionsListResponse).limit).toBe(50);
		});
	});

	// ─── GET /api/questions/:id ────────────────────────────────────────

	describe("GET /api/questions/:id", () => {
		it("returns a single question with answers", async () => {
			const { token } = await registerUser(alice);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send(sampleQuestion);

			const questionId = createRes.body.id;

			const res = await request(app).get(`/api/questions/${questionId}`);

			expect(res.status).toBe(200);

			const q = res.body as QuestionResponse;
			expect(q.id).toBe(questionId);
			expect(q.title).toBe(sampleQuestion.title);
			expect(q.body).toBe(sampleQuestion.body);
			expect(q.user).toEqual(
				expect.objectContaining({ username: "alice" })
			);
		});

		it("returns 404 for a non-existent question", async () => {
			const res = await request(app).get("/api/questions/99999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Question not found" });
		});

		it("returns 400 for an invalid ID", async () => {
			const res = await request(app).get("/api/questions/abc");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid question ID" });
		});
	});

	// ─── POST /api/questions ───────────────────────────────────────────

	describe("POST /api/questions", () => {
		it("creates a question when authenticated", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send(sampleQuestion);

			expect(res.status).toBe(201);

			const q = res.body as QuestionResponse;
			expect(q.title).toBe(sampleQuestion.title);
			expect(q.body).toBe(sampleQuestion.body);
			expect(q.user).toEqual(
				expect.objectContaining({ username: "alice" })
			);
		});

		it("returns 401 when not authenticated", async () => {
			const res = await request(app)
				.post("/api/questions")
				.send(sampleQuestion);

			expect(res.status).toBe(401);
		});

		it("returns 400 when title or body is missing", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Only title" });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("returns 400 when title or body is empty whitespace", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "   ", body: "   " });

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});
	});

	// ─── PUT /api/questions/:id ────────────────────────────────────────

	describe("PUT /api/questions/:id", () => {
		it("updates a question by the author", async () => {
			const { token } = await registerUser(alice);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send(sampleQuestion);

			const questionId = createRes.body.id;

			const res = await request(app)
				.put(`/api/questions/${questionId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Updated title" });

			expect(res.status).toBe(200);
			expect((res.body as QuestionResponse).title).toBe("Updated title");
			// Unchanged field should persist
			expect((res.body as QuestionResponse).body).toBe(sampleQuestion.body);
		});

		it("returns 403 when a non-author tries to update", async () => {
			const { token: aliceToken } = await registerUser(alice);
			const { token: bobToken } = await registerUser(bob);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${aliceToken}`)
				.send(sampleQuestion);

			const questionId = createRes.body.id;

			const res = await request(app)
				.put(`/api/questions/${questionId}`)
				.set("Authorization", `Bearer ${bobToken}`)
				.send({ title: "Hacked title" });

			expect(res.status).toBe(403);
			expect(res.body).toEqual({
				error: "Not authorized to update this question",
			});
		});

		it("returns 404 for a non-existent question", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.put("/api/questions/99999")
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "Nope" });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Question not found" });
		});

		it("returns 400 when title is empty", async () => {
			const { token } = await registerUser(alice);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send(sampleQuestion);

			const res = await request(app)
				.put(`/api/questions/${createRes.body.id}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ title: "   " });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Title cannot be empty" });
		});
	});

	// ─── DELETE /api/questions/:id ─────────────────────────────────────

	describe("DELETE /api/questions/:id", () => {
		it("deletes a question by the author", async () => {
			const { token } = await registerUser(alice);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${token}`)
				.send(sampleQuestion);

			const questionId = createRes.body.id;

			const deleteRes = await request(app)
				.delete(`/api/questions/${questionId}`)
				.set("Authorization", `Bearer ${token}`);

			expect(deleteRes.status).toBe(204);

			// Confirm it's gone
			const getRes = await request(app).get(`/api/questions/${questionId}`);
			expect(getRes.status).toBe(404);
		});

		it("returns 403 when a non-author tries to delete", async () => {
			const { token: aliceToken } = await registerUser(alice);
			const { token: bobToken } = await registerUser(bob);

			const createRes = await request(app)
				.post("/api/questions")
				.set("Authorization", `Bearer ${aliceToken}`)
				.send(sampleQuestion);

			const res = await request(app)
				.delete(`/api/questions/${createRes.body.id}`)
				.set("Authorization", `Bearer ${bobToken}`);

			expect(res.status).toBe(403);
			expect(res.body).toEqual({
				error: "Not authorized to delete this question",
			});
		});

		it("returns 404 for a non-existent question", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.delete("/api/questions/99999")
				.set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Question not found" });
		});
	});
});
