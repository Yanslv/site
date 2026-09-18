import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// TURSO_DATABASE_URL aponta para `file:./data/local.db` em desenvolvimento e
// para `libsql://<db>.turso.io` em produção. TURSO_AUTH_TOKEN só existe (e só
// é necessário) para bancos remotos — nunca é lido no navegador porque este
// módulo é marcado "server-only" e só usa variáveis sem o prefixo NEXT_PUBLIC_.
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL não configurada. Veja site/.env.example para os valores de desenvolvimento e produção."
  );
}

const authToken = process.env.TURSO_AUTH_TOKEN;
if (url.startsWith("libsql://") && !authToken) {
  throw new Error(
    "TURSO_AUTH_TOKEN é obrigatório quando TURSO_DATABASE_URL aponta para um banco Turso remoto (libsql://...)."
  );
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
export type Database = typeof db;

/** Tipo do `tx` recebido por `db.transaction(async (tx) => ...)`. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Aceita tanto o handle normal quanto um `tx` — use dentro de funções chamadas de dentro de uma transação. */
export type DbExecutor = Database | Transaction;
