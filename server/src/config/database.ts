import { Sequelize, type SyncOptions } from "sequelize";

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

export const syncDatabase = async (options?: SyncOptions): Promise<void> => {
  // Ensure models + associations are registered before syncing.
  await import("../models");

  for (let attempt = 0; attempt <= MAX_SYNC_RETRIES; attempt += 1) {
    try {
      await sequelize.sync(options);
      return;
    } catch (error) {
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
