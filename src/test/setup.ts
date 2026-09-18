// Ambiente isolado para os testes: banco SQLite em memória, nunca o banco
// de desenvolvimento (./data/local.db) nem produção.
process.env.TURSO_DATABASE_URL = ":memory:";
process.env.TURSO_AUTH_TOKEN = "";
process.env.ADMIN_EMAIL = "admin@teste.local";
process.env.ADMIN_PASSWORD = "senha-de-teste-123";
process.env.AUTO_CONFIRM_APPOINTMENTS = "false";
// NODE_ENV já é definido como "test" pelo próprio vitest.
