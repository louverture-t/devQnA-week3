import dotenv from "dotenv";
import path from "path";
import { beforeAll, beforeEach, afterAll } from "vitest";

// Load .env with an explicit path so it works regardless of CWD
dotenv.config({ path: path.resolve(__dirname, "../\.env") });

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_NAME = process.env.DB_NAME || "devqa";
process.env.DB_USER = process.env.DB_USER || "postgres";

if (!process.env.DB_PASSWORD) {
	throw new Error(
		"DB_PASSWORD is not set. Ensure server/.env exists and contains DB_PASSWORD."
	);
}

// Dynamic import AFTER env vars are set, so Sequelize reads the correct values
const { sequelize, syncDatabase } = await import("../src/config/database");

beforeAll(async () => {
	try {
		await syncDatabase({ force: true });
	} catch (error) {
		console.error(
			"\n[setup] Failed to connect to PostgreSQL.\n" +
				"  - Is PostgreSQL running?\n" +
				"  - Does the database '" +
				process.env.DB_NAME +
				"_test' exist?\n" +
				"  - Are DB_USER / DB_PASSWORD correct in server/.env?\n"
		);
		throw error;
	}
});

beforeEach(async () => {
	await sequelize.query(
		"TRUNCATE TABLE votes, answers, questions, users RESTART IDENTITY CASCADE"
	);
});

afterAll(async () => {
	await sequelize.close();
});
