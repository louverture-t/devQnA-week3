import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT) || 4000;

const startServer = async () => {
  const requiredEnv = ["DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET"];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[devqa] missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
    return;
  }

  const { default: app } = await import("./app");
  const { sequelize, syncDatabase } = await import("./config/database");

  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error(
      "[devqa] failed to connect to PostgreSQL. Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.",
      error
    );
    process.exit(1);
    return;
  }

  await syncDatabase();

  app.listen(port, () => {
    console.log(`[devqa] server listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("[devqa] failed to start server", error);
  process.exit(1);
});
