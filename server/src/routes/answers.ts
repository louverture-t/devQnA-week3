import { Router } from "express";
import { ValidationError } from "sequelize";

import { authenticateToken } from "../middleware/auth";
import { Answer, Question, User } from "../models";

const router = Router();

const mapAnswer = (answer: Answer) => {
	const data = answer.toJSON() as {
		author?: { id: number; username: string } | null;
		[key: string]: unknown;
	};

	const { author, ...rest } = data;

	return {
		...rest,
		user: author ?? null,
	};
};

router.post("/questions/:questionId/answers", authenticateToken, async (req, res) => {
	const questionId = Number.parseInt(req.params.questionId, 10);

	if (Number.isNaN(questionId)) {
		res.status(400).json({ error: "Invalid question ID" });
		return;
	}

	try {
		const { body } = req.body;

		if (body === undefined) {
			res.status(400).json({ error: "Body is required" });
			return;
		}

		if (!String(body).trim()) {
			res.status(400).json({ error: "Body cannot be empty" });
			return;
		}

		const question = await Question.findByPk(questionId);

		if (!question) {
			res.status(404).json({ error: "Question not found" });
			return;
		}

		const answer = await Answer.create({
			body: String(body).trim(),
			questionId: question.id,
			userId: req.user?.id ?? 0,
		});

		const hydratedAnswer = await Answer.findByPk(answer.id, {
			include: [{ model: User, as: "author", attributes: ["id", "username"] }],
		});

		if (!hydratedAnswer) {
			res.status(500).json({ error: "Internal server error" });
			return;
		}

		res.status(201).json(mapAnswer(hydratedAnswer));
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: "Validation error" });
			return;
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.put("/answers/:id", authenticateToken, async (req, res) => {
	const answerId = Number.parseInt(req.params.id, 10);

	if (Number.isNaN(answerId)) {
		res.status(400).json({ error: "Invalid answer ID" });
		return;
	}

	try {
		const answer = await Answer.findByPk(answerId, {
			include: [{ model: User, as: "author", attributes: ["id", "username"] }],
		});

		if (!answer) {
			res.status(404).json({ error: "Answer not found" });
			return;
		}

		if (answer.userId !== req.user?.id) {
			res.status(403).json({ error: "Not authorized to update this answer" });
			return;
		}

		const { body } = req.body;

		if (body === undefined) {
			res.status(400).json({ error: "Body is required" });
			return;
		}

		if (!String(body).trim()) {
			res.status(400).json({ error: "Body cannot be empty" });
			return;
		}

		answer.body = String(body).trim();
		await answer.save();

		res.json(mapAnswer(answer));
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: "Validation error" });
			return;
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.delete("/answers/:id", authenticateToken, async (req, res) => {
	const answerId = Number.parseInt(req.params.id, 10);

	try {
		const answer = await Answer.findByPk(answerId);

		if (!answer) {
			res.status(404).json({ error: "Answer not found" });
			return;
		}

		if (answer.userId !== req.user?.id) {
			res.status(403).json({ error: "Not authorized to delete this answer" });
			return;
		}

		await answer.destroy();
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
