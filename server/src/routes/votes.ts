import { Router } from "express";

import { authenticateToken } from "../middleware/auth";
import { Answer, Vote } from "../models";
import type { VoteType } from "../models/Vote";

const router = Router();

const isValidVoteType = (value: unknown): value is VoteType =>
	value === "up" || value === "down";

router.post("/:answerId/vote", authenticateToken, async (req, res) => {
	const answerId = Number.parseInt(req.params.answerId, 10);

	if (Number.isNaN(answerId)) {
		res.status(400).json({ error: "Invalid answer ID" });
		return;
	}

	try {
		const { type } = req.body;

		if (type === undefined) {
			res.status(400).json({ error: "Vote type is required" });
			return;
		}

		if (!isValidVoteType(type)) {
			res.status(400).json({ error: "Vote type must be either \"up\" or \"down\"" });
			return;
		}

		const answer = await Answer.findByPk(answerId);

		if (!answer) {
			res.status(404).json({ error: "Answer not found" });
			return;
		}

		if (answer.userId === (req.user?.id ?? 0)) {
			res.status(403).json({ error: "Cannot vote on your own answer" });
			return;
		}

		const existingVote = await Vote.findOne({
			where: { answerId, userId: req.user?.id ?? 0 },
		});

		let userVote: VoteType | null = null;

		if (!existingVote) {
			await Vote.create({
				answerId,
				userId: req.user?.id ?? 0,
				type,
			});
			userVote = type;
		} else if (existingVote.type === type) {
			await existingVote.destroy();
			userVote = null;
		} else {
			existingVote.type = type;
			await existingVote.save();
			userVote = type;
		}

		const voteCount = await Vote.count({ where: { answerId } });

		res.json({ voteCount, userVote });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
