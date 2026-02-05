import { Router } from "express";
import jwt from "jsonwebtoken";
import { UniqueConstraintError } from "sequelize";

import { authenticateToken } from "../middleware/auth";
import { User } from "../models";

const router = Router();

const toPublicUser = (user: User) => ({
	id: user.id,
	username: user.username,
	email: user.email,
});

router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			res
				.status(400)
				.json({ error: "Username, email, and password are required" });
			return;
		}

		if (password.length < 8) {
			res.status(400).json({ error: "Password must be at least 8 characters" });
			return;
		}

		const user = await User.create({ username, email, password });
		const jwtSecret = process.env.JWT_SECRET;

		if (!jwtSecret) {
			res.status(500).json({ error: "Internal server error" });
			return;
		}

		const publicUser = toPublicUser(user);
		const token = jwt.sign(publicUser, jwtSecret, { expiresIn: "1h" });

		res.status(201).json({ token, user: publicUser });
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			const field = error.errors?.[0]?.path;

			if (field === "username") {
				res.status(409).json({ error: "Username already exists" });
				return;
			}

			if (field === "email") {
				res.status(409).json({ error: "Email already exists" });
				return;
			}

			res.status(409).json({ error: "User already exists" });
			return;
		}

		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({ error: "Email and password are required" });
			return;
		}

		const user = await User.findOne({ where: { email } });

		if (!user) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const jwtSecret = process.env.JWT_SECRET;

		if (!jwtSecret) {
			res.status(500).json({ error: "Internal server error" });
			return;
		}

		const publicUser = toPublicUser(user);
		const token = jwt.sign(publicUser, jwtSecret, { expiresIn: "1h" });

		res.status(200).json({ token, user: publicUser });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/verify", authenticateToken, async (req, res) => {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const user = await User.findByPk(req.user.id);

		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		res.status(200).json({ user: toPublicUser(user) });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
