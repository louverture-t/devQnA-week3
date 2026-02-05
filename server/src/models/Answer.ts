import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../config/database";

export interface AnswerAttributes {
  id: number;
  body: string;
  questionId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnswerCreationAttributes
  extends Optional<AnswerAttributes, "id" | "createdAt" | "updatedAt"> {}

class Answer
  extends Model<AnswerAttributes, AnswerCreationAttributes>
  implements AnswerAttributes
{
  declare id: number;
  declare body: string;
  declare questionId: number;
  declare userId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

Answer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 10000],
      },
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "question_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "answers",
  }
);

export default Answer;
