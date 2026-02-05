/// <reference types="vitest" />

import request from "supertest";

let app: typeof import("../../src/app").default;

type AuthResponse = {
	token: string;
	user: { id: number; username: string; email: string };
};

type AnswerResponse = {
	id: number;
	body: string;
	questionId: number;
	userId: number;
	user: { id: number; username: string } | null;
	createdAt: string;
	updatedAt: string;
};

const registerUser = async (payload: {
	username: string;
	email: string;
	password: string;
}): Promise<AuthResponse> => {
	const res = await request(app).post("/api/auth/register").send(payload);
	return res.body as AuthResponse;
};

const createQuestion = async (token: string): Promise<number> => {
	const res = await request(app)
		.post("/api/questions")
		.set("Authorization", `Bearer ${token}`)
		.send({ title: "Test Question", body: "A question for answer tests." });
	return res.body.id as number;
};

const alice = { username: "alice", email: "alice@example.com", password: "password123" };
const bob = { username: "bob", email: "bob@example.com", password: "password123" };

describe("Answers API", () => {
	beforeAll(async () => {
		app = (await import("../../src/app")).default;
	});

	// ─── POST /api/questions/:questionId/answers ───────────────────────

	describe("POST /api/questions/:questionId/answers", () => {
		it("creates an answer for an existing question", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const res = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "This is my answer." });

			expect(res.status).toBe(201);

			const answer = res.body as AnswerResponse;
			expect(answer.body).toBe("This is my answer.");
			expect(answer.questionId).toBe(questionId);
			expect(answer.user).toEqual(
				expect.objectContaining({ username: "alice" })
			);
		});

		it("returns 401 when not authenticated", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const res = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.send({ body: "No auth." });

			expect(res.status).toBe(401);
		});

		it("returns 404 for a non-existent question", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.post("/api/questions/99999/answers")
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Orphan answer." });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Question not found" });
		});

		it("returns 400 when body is missing", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const res = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({});

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Body is required" });
		});

		it("returns 400 when body is empty whitespace", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const res = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "   " });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Body cannot be empty" });
		});

		it("returns 400 for an invalid question ID", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.post("/api/questions/abc/answers")
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Bad ID." });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid question ID" });
		});
	});

	// ─── PUT /api/answers/:id ──────────────────────────────────────────

	describe("PUT /api/answers/:id", () => {
		it("updates an answer by the author", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Original answer." });

			const answerId = createRes.body.id;

			const res = await request(app)
				.put(`/api/answers/${answerId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Updated answer." });

			expect(res.status).toBe(200);
			expect((res.body as AnswerResponse).body).toBe("Updated answer.");
		});

		it("returns 403 when a non-author tries to update", async () => {
			const { token: aliceToken } = await registerUser(alice);
			const { token: bobToken } = await registerUser(bob);
			const questionId = await createQuestion(aliceToken);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${aliceToken}`)
				.send({ body: "Alice's answer." });

			const res = await request(app)
				.put(`/api/answers/${createRes.body.id}`)
				.set("Authorization", `Bearer ${bobToken}`)
				.send({ body: "Bob tries to edit." });

			expect(res.status).toBe(403);
			expect(res.body).toEqual({
				error: "Not authorized to update this answer",
			});
		});

		it("returns 404 for a non-existent answer", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.put("/api/answers/99999")
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "No answer here." });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Answer not found" });
		});

		it("returns 400 when body is missing", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Some answer." });

			const res = await request(app)
				.put(`/api/answers/${createRes.body.id}`)
				.set("Authorization", `Bearer ${token}`)
				.send({});

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Body is required" });
		});

		it("returns 400 when body is empty whitespace", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "Some answer." });

			const res = await request(app)
				.put(`/api/answers/${createRes.body.id}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "   " });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Body cannot be empty" });
		});
	});

	// ─── DELETE /api/answers/:id ───────────────────────────────────────

	describe("DELETE /api/answers/:id", () => {
		it("deletes an answer by the author", async () => {
			const { token } = await registerUser(alice);
			const questionId = await createQuestion(token);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${token}`)
				.send({ body: "To be deleted." });

			const answerId = createRes.body.id;

			const res = await request(app)
				.delete(`/api/answers/${answerId}`)
				.set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(204);
		});

		it("returns 403 when a non-author tries to delete", async () => {
			const { token: aliceToken } = await registerUser(alice);
			const { token: bobToken } = await registerUser(bob);
			const questionId = await createQuestion(aliceToken);

			const createRes = await request(app)
				.post(`/api/questions/${questionId}/answers`)
				.set("Authorization", `Bearer ${aliceToken}`)
				.send({ body: "Alice's answer." });

			const res = await request(app)
				.delete(`/api/answers/${createRes.body.id}`)
				.set("Authorization", `Bearer ${bobToken}`);

			expect(res.status).toBe(403);
			expect(res.body).toEqual({
				error: "Not authorized to delete this answer",
			});
		});

		it("returns 404 for a non-existent answer", async () => {
			const { token } = await registerUser(alice);

			const res = await request(app)
				.delete("/api/answers/99999")
				.set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Answer not found" });
		});
	});
});
