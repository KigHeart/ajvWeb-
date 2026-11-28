import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./server/app";
import { openDatabase } from "./server/database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DB_PATH = process.env.AJENTIR_DB_PATH || path.resolve(__dirname, "data", "ajentir.sqlite");

async function start() {
  const database = openDatabase(DB_PATH);
  const app = createApp({
    database,
    staticDir: IS_PROD ? path.resolve(__dirname, "dist") : undefined,
    trustedProxy: process.env.AJENTIR_TRUSTED_PROXY?.trim() || undefined,
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ajentir Ventures server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void start();
