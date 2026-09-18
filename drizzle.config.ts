import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? "file:./data/local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
  verbose: true,
  strict: true,
});
