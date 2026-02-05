import Answer from "./Answer";
import Question from "./Question";
import User from "./User";
import Vote from "./Vote";

User.hasMany(Question, { foreignKey: "userId", as: "questions" });
Question.belongsTo(User, { foreignKey: "userId", as: "author" });

Question.hasMany(Answer, { foreignKey: "questionId", as: "answers" });
Answer.belongsTo(Question, { foreignKey: "questionId" });

User.hasMany(Answer, { foreignKey: "userId", as: "answers" });
Answer.belongsTo(User, { foreignKey: "userId", as: "author" });

Answer.hasMany(Vote, { foreignKey: "answerId", as: "votes" });
Vote.belongsTo(Answer, { foreignKey: "answerId" });

User.hasMany(Vote, { foreignKey: "userId", as: "votes" });
Vote.belongsTo(User, { foreignKey: "userId", as: "voter" });

export { Answer, Question, User, Vote };
