import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../config/database";

export interface QuestionAttributes {
  id: number;
  title: string;
  body: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionCreationAttributes
  extends Optional<QuestionAttributes, "id" | "createdAt" | "updatedAt"> {}

class Question
  extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes
{
  declare id: number;
  declare title: string;
  declare body: string;
  declare userId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [10, 255],
      },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [20, 10000],
      },
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
    tableName: "questions",
  }
);

export default Question;
