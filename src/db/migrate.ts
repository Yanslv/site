import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import { createClient, type Client } from "@libsql/client";

const migrationsFolder = "./src/db/migrations";

type JournalEntry = { tag: string; when: number };

function isAlreadyApplied(message: string) {
  return /already exists|duplicate column name/i.test(message);
}

async function ensureMigrationsTable(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);
}

async function appliedTimestamps(client: Client) {
  const result = await client.execute(
    `SELECT created_at FROM "__drizzle_migrations"`,
  );
  return new Set(result.rows.map((row) => Number(row.created_at)));
}

async function applyEntry(client: Client, entry: JournalEntry) {
  const query = fs.readFileSync(`${migrationsFolder}/${entry.tag}.sql`, "utf8");
  const statements = query
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isAlreadyApplied(message)) throw error;
    }
  }

  const hash = crypto.createHash("sha256").update(query).digest("hex");
  await client.execute({
    sql: `INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)`,
    args: [hash, entry.when],
  });
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL não configurada (veja site/.env.example).");
  }

  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });
  const target = url.startsWith("libsql://") ? new URL(url).host : "arquivo local";
  console.log(`Aplicando migrações em ${target}...`);

  await ensureMigrationsTable(client);
  const applied = await appliedTimestamps(client);
  const journal = JSON.parse(
    fs.readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"),
  ) as { entries: JournalEntry[] };

  for (const entry of journal.entries) {
    if (applied.has(entry.when)) continue;
    await applyEntry(client, entry);
    console.log(`aplicada ${entry.tag}`);
  }

  console.log("Migrações aplicadas com sucesso.");
  client.close();
}

main().catch((error) => {
  console.error("Falha ao aplicar migrações:", error);
  process.exit(1);
});
