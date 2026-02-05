import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../config/database";

export type VoteType = "up" | "down";

export interface VoteAttributes {
  id: number;
  answerId: number;
  userId: number;
  type: VoteType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VoteCreationAttributes
  extends Optional<VoteAttributes, "id" | "createdAt" | "updatedAt"> {}

class Vote
  extends Model<VoteAttributes, VoteCreationAttributes>
  implements VoteAttributes
{
  declare id: number;
  declare answerId: number;
  declare userId: number;
  declare type: VoteType;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

Vote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    answerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "answer_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    type: {
      type: DataTypes.ENUM("up", "down"),
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "votes",
    indexes: [
      {
        unique: true,
        fields: ["answer_id", "user_id"],
      },
    ],
  }
);

export default Vote;
