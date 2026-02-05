import bcrypt from "bcrypt";
import { QueryTypes, Sequelize, type SyncOptions } from "sequelize";

const isTest = process.env.NODE_ENV === "test";
const baseDatabaseName = process.env.DB_NAME || "devqa";
const databaseName = isTest ? `${baseDatabaseName}_test` : baseDatabaseName;

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  throw new Error(
    "DB_PASSWORD environment variable is not set. " +
      "Ensure your .env file exists in server/ and contains DB_PASSWORD."
  );
}

export const sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER ?? "postgres",
  dbPassword,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const MAX_SYNC_RETRIES = 5;
const RETRY_DELAY_MS = 500;
const DEFAULT_SEED_PASSWORD = "m1sieroro";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isCatalogRaceError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("pg_type_typname_nsp_index") ||
    error.message.includes("duplicate key value violates unique constraint")
  );
};

const isPasswordNullConstraintError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const anyError = error as {
    parent?: { code?: string; column?: string; sql?: string };
  };

  const parent = anyError.parent;
  const parentCode = parent?.code;
  const parentSql = parent?.sql ?? "";
  const message = error.message ?? "";

  return (
    parentCode === "23502" &&
    (parent?.column === "password" ||
      parentSql.includes('ADD COLUMN "password"') ||
      message.includes('column "password" of relation "users" contains null values'))
  );
};

const attemptPasswordColumnRepair = async (): Promise<boolean> => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const columns = await sequelize.query<{ column_name: string }>(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password';
    `,
    { type: QueryTypes.SELECT }
  );

  if (!Array.isArray(columns) || columns.length === 0) {
    await sequelize.query(
      'ALTER TABLE "public"."users" ADD COLUMN "password" VARCHAR(255);',
      { type: QueryTypes.RAW }
    );
  }

  const nullCounts = await sequelize.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM "public"."users" WHERE "password" IS NULL;',
    { type: QueryTypes.SELECT }
  );

  const nullCount = Number(nullCounts?.[0]?.count ?? 0);

  if (nullCount > 0) {
    const seedPassword = process.env.SEED_USER_PASSWORD ?? DEFAULT_SEED_PASSWORD;
    const hashedPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS);

    await sequelize.query(
      'UPDATE "public"."users" SET "password" = :password WHERE "password" IS NULL;',
      {
        replacements: { password: hashedPassword },
        type: QueryTypes.UPDATE,
      }
    );
  }

  await sequelize.query(
    'ALTER TABLE "public"."users" ALTER COLUMN "password" SET NOT NULL;',
    { type: QueryTypes.RAW }
  );

  console.warn(
    "[devqa] repaired users.password column (filled nulls) to satisfy NOT NULL constraint."
  );

  return true;
};

export const syncDatabase = async (options?: SyncOptions): Promise<void> => {
  // Ensure models + associations are registered before syncing.
  await import("../models");

  const shouldAlter =
    !options && process.env.NODE_ENV !== "production";
  const syncOptions: SyncOptions | undefined = options ?? (shouldAlter ? { alter: true } : undefined);

  for (let attempt = 0; attempt <= MAX_SYNC_RETRIES; attempt += 1) {
    try {
      await sequelize.sync(syncOptions);
      return;
    } catch (error) {
      if (isPasswordNullConstraintError(error)) {
        const repaired = await attemptPasswordColumnRepair();
        if (repaired) {
          continue;
        }
      }

      const shouldRetry = isCatalogRaceError(error) && attempt < MAX_SYNC_RETRIES;

      if (!shouldRetry) {
        throw error;
      }

      console.warn(
        `[devqa] sequelize.sync catalog race detected, retrying (${attempt + 1}/${MAX_SYNC_RETRIES})...`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
};
