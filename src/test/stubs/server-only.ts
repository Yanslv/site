// Stub usado apenas em testes (vitest.config.ts faz o alias de "server-only"
// para este arquivo). Fora dos testes, o pacote real "server-only" continua
// lançando erro se importado a partir de um Client Component — essa proteção
// não é enfraquecida em produção, só neutralizada no ambiente de teste, que
// roda em Node puro (um contexto de servidor legítimo).
export {};
