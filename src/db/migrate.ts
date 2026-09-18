import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL não configurada (veja site/.env.example).");
  }

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const db = drizzle(client);

  console.log(`Aplicando migrações em ${url}...`);
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrações aplicadas com sucesso.");

  client.close();
}

main().catch((error) => {
  console.error("Falha ao aplicar migrações:", error);
  process.exit(1);
});
