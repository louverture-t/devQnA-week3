import "dotenv/config";

import app from "./app";
import { syncDatabase } from "./config/database";

const port = Number(process.env.PORT) || 4000;

const startServer = async () => {
  await syncDatabase();

  app.listen(port, () => {
    console.log(`[devqa] server listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("[devqa] failed to start server", error);
  process.exit(1);
});
