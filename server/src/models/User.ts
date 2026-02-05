import bcrypt from "bcrypt";
import { DataTypes, Model, Optional } from "sequelize";

import { sequelize } from "../config/database";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 20],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "users",
    hooks: {
      beforeCreate: async (user) => {
        if (!user.changed("password")) {
          return;
        }

        user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
      },
      beforeUpdate: async (user) => {
        if (!user.changed("password")) {
          return;
        }

        user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
      },
    },
  }
);

export default User;
