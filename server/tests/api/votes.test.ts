/// <reference types="vitest" />

import request from "supertest";

let app: typeof import("../../src/app").default;

type AuthResponse = {
	token: string;
	user: { id: number; username: string; email: string };
};

type VoteResponse = {
	voteCount: number;
	userVote: "up" | "down" | null;
};

const registerUser = async (payload: {
	username: string;
	email: string;
	password: string;
}): Promise<AuthResponse> => {
	const response = await request(app).post("/api/auth/register").send(payload);
	return response.body as AuthResponse;
};

const createQuestion = async (token: string): Promise<number> => {
	const response = await request(app)
		.post("/api/questions")
		.set("Authorization", `Bearer ${token}`)
		.send({
			title: "How do I write better tests?",
			body: "Share your approach to testing backend APIs with Vitest.",
		});
	return response.body.id as number;
};

const createAnswer = async (token: string, questionId: number): Promise<number> => {
	const response = await request(app)
		.post(`/api/questions/${questionId}/answers`)
		.set("Authorization", `Bearer ${token}`)
		.send({ body: "Use supertest with Vitest and reset the database between runs." });
	return response.body.id as number;
};

describe("POST /api/answers/:answerId/vote", () => {
	beforeAll(async () => {
		app = (await import("../../src/app")).default;
	});

	it("rejects voting on own answers", async () => {
		const author = await registerUser({
			username: "author",
			email: "author@example.com",
			password: "password123",
		});

		const questionId = await createQuestion(author.token);
		const answerId = await createAnswer(author.token, questionId);

		const response = await request(app)
			.post(`/api/answers/${answerId}/vote`)
			.set("Authorization", `Bearer ${author.token}`)
			.send({ type: "up" });

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Cannot vote on your own answer" });
	});

	it("toggles and switches votes", async () => {
		const author = await registerUser({
			username: "answer-owner",
			email: "owner@example.com",
			password: "password123",
		});
		const voter = await registerUser({
			username: "voter",
			email: "voter@example.com",
			password: "password123",
		});

		const questionId = await createQuestion(author.token);
		const answerId = await createAnswer(author.token, questionId);

		const firstVote = await request(app)
			.post(`/api/answers/${answerId}/vote`)
			.set("Authorization", `Bearer ${voter.token}`)
			.send({ type: "up" });

		expect(firstVote.status).toBe(200);
		expect(firstVote.body).toEqual<VoteResponse>({ voteCount: 1, userVote: "up" });

		const toggleVote = await request(app)
			.post(`/api/answers/${answerId}/vote`)
			.set("Authorization", `Bearer ${voter.token}`)
			.send({ type: "up" });

		expect(toggleVote.status).toBe(200);
		expect(toggleVote.body).toEqual<VoteResponse>({ voteCount: 0, userVote: null });

		const downVote = await request(app)
			.post(`/api/answers/${answerId}/vote`)
			.set("Authorization", `Bearer ${voter.token}`)
			.send({ type: "down" });

		expect(downVote.status).toBe(200);
		expect(downVote.body).toEqual<VoteResponse>({ voteCount: 1, userVote: "down" });

		const switchVote = await request(app)
			.post(`/api/answers/${answerId}/vote`)
			.set("Authorization", `Bearer ${voter.token}`)
			.send({ type: "up" });

		expect(switchVote.status).toBe(200);
		expect(switchVote.body).toEqual<VoteResponse>({ voteCount: 1, userVote: "up" });
	});
});
