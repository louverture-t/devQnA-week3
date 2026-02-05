import { Router } from "express";

import { User } from "../models";

const router = Router();

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 5;
const DEFAULT_PAGE = 1;

const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value), 10);

	if (Number.isNaN(parsed) || parsed < 1) {
		return fallback;
	}

	return parsed;
};

router.get("/", async (req, res) => {
	try {
		const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
		const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
		const limit = Math.min(requestedLimit, MAX_LIMIT);
		const offset = (page - 1) * limit;

		const { rows, count } = await User.findAndCountAll({
			attributes: ["id", "username", "createdAt"],
			order: [["createdAt", "DESC"]],
			limit,
			offset,
		});

		res.json({
			items: rows.map((user) => user.toJSON()),
			page,
			limit,
			totalItems: count,
			totalPages: Math.ceil(count / limit),
		});
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

export default router;
