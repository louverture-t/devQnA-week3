import { Router } from "express";
import { ValidationError } from "sequelize";

import { authenticateToken } from "../middleware/auth";
import { Answer, Question, User } from "../models";

const router = Router();

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value), 10);

	if (Number.isNaN(parsed) || parsed < 1) {
		return fallback;
	}

	return parsed;
};

const mapQuestion = (question: Question) => {
	const data = question.toJSON() as {
		author?: { id: number; username: string } | null;
		answers?: Array<Record<string, unknown> & { author?: { id: number; username: string } }>;
		[key: string]: unknown;
	};

	const { author, answers, ...rest } = data;

	return {
		...rest,
		user: author ?? null,
		answers: answers?.map((answer) => {
			const { author: answerAuthor, ...answerRest } = answer;

			return {
				...answerRest,
				user: answerAuthor ?? null,
			};
		}),
	};
};

router.get("/", async (req, res) => {
	try {
		const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
		const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
		const limit = Math.min(requestedLimit, MAX_LIMIT);
		const offset = (page - 1) * limit;

		const { rows, count } = await Question.findAndCountAll({
			include: [{ model: User, as: "author", attributes: ["id", "username"] }],
			order: [["createdAt", "DESC"]],
			limit,
			offset,
		});

		const items = rows.map((question) => {
			const { answers, ...mapped } = mapQuestion(question);
			return mapped;
		});

		res.json({
			items,
			page,
			limit,
			totalItems: count,
			totalPages: Math.ceil(count / limit),
		});
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: "Validation error" });
			return;
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/:id", async (req, res) => {
	const questionId = Number.parseInt(req.params.id, 10);

	if (Number.isNaN(questionId)) {
		res.status(400).json({ error: "Invalid question ID" });
		return;
	}

	try {
		const question = await Question.findByPk(questionId, {
			include: [
				{ model: User, as: "author", attributes: ["id", "username"] },
				{
					model: Answer,
					as: "answers",
					include: [{ model: User, as: "author", attributes: ["id", "username"] }],
				},
			],
			order: [[{ model: Answer, as: "answers" }, "createdAt", "ASC"]],
		});

		if (!question) {
			res.status(404).json({ error: "Question not found" });
			return;
		}

		res.json(mapQuestion(question));
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: "Validation error" });
			return;
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/", authenticateToken, async (req, res) => {
	try {
		const { title, body } = req.body;

		if (!title || !body) {
			res.status(400).json({ error: "Title and body are required" });
			return;
		}

		if (!title.trim() || !body.trim()) {
			res.status(400).json({ error: "Title and body cannot be empty" });
			return;
		}

		const question = await Question.create({
			title: title.trim(),
			body: body.trim(),
			userId: req.user?.id ?? 0,
		});

		const hydratedQuestion = await Question.findByPk(question.id, {
			include: [{ model: User, as: "author", attributes: ["id", "username"] }],
		});

		if (!hydratedQuestion) {
			res.status(500).json({ error: "Internal server error" });
			return;
		}

		res.status(201).json(mapQuestion(hydratedQuestion));
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

router.put("/:id", authenticateToken, async (req, res) => {
	const questionId = Number.parseInt(req.params.id, 10);

	if (Number.isNaN(questionId)) {
		res.status(400).json({ error: "Invalid question ID" });
		return;
	}

	try {
		const question = await Question.findByPk(questionId);

		if (!question) {
			res.status(404).json({ error: "Question not found" });
			return;
		}

		if (question.userId !== req.user?.id) {
			res.status(403).json({ error: "Not authorized to update this question" });
			return;
		}

		const { title, body } = req.body;

		if (title !== undefined && !String(title).trim()) {
			res.status(400).json({ error: "Title cannot be empty" });
			return;
		}

		if (body !== undefined && !String(body).trim()) {
			res.status(400).json({ error: "Body cannot be empty" });
			return;
		}

		if (title !== undefined) {
			question.title = String(title).trim();
		}

		if (body !== undefined) {
			question.body = String(body).trim();
		}

		await question.save();

		const hydratedQuestion = await Question.findByPk(question.id, {
			include: [{ model: User, as: "author", attributes: ["id", "username"] }],
		});

		if (!hydratedQuestion) {
			res.status(500).json({ error: "Internal server error" });
			return;
		}

		res.json(mapQuestion(hydratedQuestion));
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

router.delete("/:id", authenticateToken, async (req, res) => {
	const questionId = Number.parseInt(req.params.id, 10);

	if (Number.isNaN(questionId)) {
		res.status(400).json({ error: "Invalid question ID" });
		return;
	}

	try {
		const question = await Question.findByPk(questionId);

		if (!question) {
			res.status(404).json({ error: "Question not found" });
			return;
		}

		if (question.userId !== req.user?.id) {
			res.status(403).json({ error: "Not authorized to delete this question" });
			return;
		}

		await question.destroy();
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
