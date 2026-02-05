/// <reference types="vitest" />

import request from "supertest";

let app: typeof import("../../src/app").default;

type UsersResponse = {
	items: Array<{ id: number; username: string; createdAt: string }>;
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
};

const registerUser = async (payload: {
	username: string;
	email: string;
	password: string;
}): Promise<void> => {
	await request(app).post("/api/auth/register").send(payload);
};

describe("GET /api/users", () => {
	beforeAll(async () => {
		app = (await import("../../src/app")).default;
	});

	it("returns public user data with pagination defaults", async () => {
		await registerUser({
			username: "alice",
			email: "alice@example.com",
			password: "password123",
		});
		await registerUser({
			username: "bob",
			email: "bob@example.com",
			password: "password123",
		});

		const response = await request(app).get("/api/users");
		expect(response.status).toBe(200);

		const body = response.body as UsersResponse;
		expect(body.page).toBe(1);
		expect(body.limit).toBe(5);
		expect(body.items.length).toBeGreaterThanOrEqual(2);
		expect(body.items[0]).toEqual(
			expect.objectContaining({
				id: expect.any(Number),
				username: expect.any(String),
				createdAt: expect.any(String),
			})
		);
		expect(body.items[0]).not.toHaveProperty("email");
	});

	it("respects pagination parameters", async () => {
		for (let index = 0; index < 6; index += 1) {
			await registerUser({
				username: `user-${index}`,
				email: `user-${index}@example.com`,
				password: "password123",
			});
		}

		const response = await request(app).get("/api/users").query({
			page: 2,
			limit: 3,
		});

		expect(response.status).toBe(200);

		const body = response.body as UsersResponse;
		expect(body.page).toBe(2);
		expect(body.limit).toBe(3);
		expect(body.items.length).toBe(3);
	});
});
