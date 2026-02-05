/// <reference types="vitest" />

import request from "supertest";

let app: typeof import("../../src/app").default;

type AuthResponse = {
	token: string;
	user: { id: number; username: string; email: string };
};

const validUser = {
	username: "testuser",
	email: "testuser@example.com",
	password: "password123",
};

const registerUser = async (
	payload = validUser
): Promise<request.Response> => {
	return request(app).post("/api/auth/register").send(payload);
};

describe("Auth API", () => {
	beforeAll(async () => {
		app = (await import("../../src/app")).default;
	});

	// ─── POST /api/auth/register ───────────────────────────────────────

	describe("POST /api/auth/register", () => {
		it("registers a new user and returns a token", async () => {
			const res = await registerUser();

			expect(res.status).toBe(201);

			const body = res.body as AuthResponse;
			expect(body.token).toEqual(expect.any(String));
			expect(body.user).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					username: validUser.username,
					email: validUser.email,
				})
			);
			// must not leak the password hash
			expect(body.user).not.toHaveProperty("password");
		});

		it("rejects registration when required fields are missing", async () => {
			const res = await registerUser({
				username: "",
				email: "",
				password: "",
			});

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("rejects passwords shorter than 8 characters", async () => {
			const res = await registerUser({
				username: "short",
				email: "short@example.com",
				password: "abc",
			});

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Password must be at least 8 characters",
			});
		});

		it("returns 409 when username already exists", async () => {
			await registerUser();
			const res = await registerUser({
				...validUser,
				email: "other@example.com",
			});

			expect(res.status).toBe(409);
			expect(res.body).toEqual({ error: "Username already exists" });
		});

		it("returns 409 when email already exists", async () => {
			await registerUser();
			const res = await registerUser({
				...validUser,
				username: "otheruser",
			});

			expect(res.status).toBe(409);
			expect(res.body).toEqual({ error: "Email already exists" });
		});
	});

	// ─── POST /api/auth/login ──────────────────────────────────────────

	describe("POST /api/auth/login", () => {
		it("logs in with valid credentials and returns a token", async () => {
			await registerUser();

			const res = await request(app).post("/api/auth/login").send({
				email: validUser.email,
				password: validUser.password,
			});

			expect(res.status).toBe(200);

			const body = res.body as AuthResponse;
			expect(body.token).toEqual(expect.any(String));
			expect(body.user).toEqual(
				expect.objectContaining({
					username: validUser.username,
					email: validUser.email,
				})
			);
		});

		it("rejects login when fields are missing", async () => {
			const res = await request(app).post("/api/auth/login").send({});

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("returns 401 for a non-existent email", async () => {
			const res = await request(app).post("/api/auth/login").send({
				email: "nobody@example.com",
				password: "password123",
			});

			expect(res.status).toBe(401);
			expect(res.body).toEqual({ error: "Invalid credentials" });
		});

		it("returns 401 for wrong password", async () => {
			await registerUser();

			const res = await request(app).post("/api/auth/login").send({
				email: validUser.email,
				password: "wrongpassword",
			});

			expect(res.status).toBe(401);
			expect(res.body).toEqual({ error: "Invalid credentials" });
		});
	});

	// ─── GET /api/auth/verify ──────────────────────────────────────────

	describe("GET /api/auth/verify", () => {
		it("verifies a valid token and returns the user", async () => {
			const registerRes = await registerUser();
			const { token } = registerRes.body as AuthResponse;

			const res = await request(app)
				.get("/api/auth/verify")
				.set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body.user).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					username: validUser.username,
					email: validUser.email,
				})
			);
		});

		it("returns 401 when no token is provided", async () => {
			const res = await request(app).get("/api/auth/verify");

			expect(res.status).toBe(401);
			expect(res.body).toHaveProperty("error");
		});

		it("returns 401 for an invalid token", async () => {
			const res = await request(app)
				.get("/api/auth/verify")
				.set("Authorization", "Bearer invalidtoken123");

			expect(res.status).toBe(401);
			expect(res.body).toHaveProperty("error");
		});
	});
});
