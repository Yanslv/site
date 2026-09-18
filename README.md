# Bendita Micro — site + agendamento + gestão (protótipo)

Aplicação Next.js (App Router, TypeScript, Tailwind CSS, Drizzle ORM,
SQLite/libSQL) para a marca **Bendita Micro / Ioná Victório**: landing page
pública, fluxo de agendamento do cliente e painel privado de gestão
(agenda, clientes, serviços e financeiro).

Este é um **protótipo comercial com dados de demonstração**. O banner fixo
no topo do site público, o badge `DEMO` no painel e o arquivo
[`CONTENT_REVIEW.md`](./CONTENT_REVIEW.md) explicam o que ainda precisa ser
validado pela profissional antes da publicação.

## Requisitos

- Node.js 20 ou superior
- npm (o projeto foi desenvolvido e testado com npm; se você usa pnpm, os
  mesmos scripts — `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
  — funcionam da mesma forma, pnpm não estava disponível no ambiente onde
  este projeto foi gerado)

## Instalação e desenvolvimento local

```bash
npm install
cp .env.example .env   # ajuste os valores se quiser (veja abaixo)
npm run db:migrate     # cria/atualiza o banco SQLite local em data/local.db
npm run db:seed        # popula dados demo (serviços, horários, agendamentos, financeiro)
npm run dev
```

Acesse:

- Site público: http://localhost:3000
- Agendamento: http://localhost:3000/agendar
- Painel: http://localhost:3000/admin/login

Login do painel (definido pelo seed, a partir de `ADMIN_EMAIL` /
`ADMIN_PASSWORD` do `.env`):

```
E-mail: admin@benditamicro.demo
Senha:  demo1234
```

**Troque essa senha** (edite `ADMIN_PASSWORD` no `.env` e rode `npm run
db:seed` novamente) antes de qualquer uso além de demonstração local — o
seed apenas cria/atualiza o usuário proprietário, nunca duplica.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção localmente |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Testes (Vitest) — unitários e de integração |
| `npm run test:watch` | Testes em modo watch |
| `npm run db:generate` | Gera uma nova migração a partir do schema (`src/db/schema/`) |
| `npm run db:migrate` | Aplica as migrações pendentes no banco de `TURSO_DATABASE_URL` |
| `npm run db:seed` | Roda o seed idempotente (dados demo) |
| `npm run db:studio` | Abre o Drizzle Studio para inspecionar o banco |

## Banco de dados: SQLite local em dev, Turso em produção

O projeto usa **Drizzle ORM** com o cliente **libSQL** (`@libsql/client`),
que fala com um arquivo SQLite local (`file:./data/local.db`) e com um
banco Turso remoto (`libsql://...`) através da mesma API — só muda a
variável de ambiente `TURSO_DATABASE_URL`.

```bash
# desenvolvimento (site/.env)
TURSO_DATABASE_URL=file:./data/local.db
TURSO_AUTH_TOKEN=

# produção (variáveis de ambiente da Vercel)
TURSO_DATABASE_URL=libsql://<seu-banco>.turso.io
TURSO_AUTH_TOKEN=<token-gerado-no-turso>
```

**Importante:** a Vercel roda funções serverless — o filesystem de cada
invocação é efêmero e não é compartilhado entre requisições. Por isso,
`file:./data/local.db` **só funciona em desenvolvimento local**. Em
produção, `TURSO_DATABASE_URL` precisa apontar para um banco Turso Cloud
real (`libsql://...`), nunca para um caminho de arquivo.

O código nunca grava em `./data/local.db` "por acidente" em produção: o
valor vem sempre da variável de ambiente, e a validação em
`src/db/client.ts` recusa iniciar se `TURSO_DATABASE_URL` apontar para
`libsql://` sem um `TURSO_AUTH_TOKEN`.

### Criando um banco Turso e conectando na Vercel

1. Crie uma conta em https://turso.tech e instale a Turso CLI (ou use o
   dashboard web).
2. Crie o banco: `turso db create bendita-micro`.
3. Pegue a URL de conexão: `turso db show bendita-micro --url` → algo como
   `libsql://bendita-micro-<org>.turso.io`.
4. Gere um token: `turso db tokens create bendita-micro`.
5. Na Vercel, no projeto, vá em **Settings → Environment Variables** e
   adicione:
   - `TURSO_DATABASE_URL` = a URL `libsql://...`
   - `TURSO_AUTH_TOKEN` = o token gerado
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (usados apenas ao rodar o seed)
   - `AUTO_CONFIRM_APPOINTMENTS` = `false`
6. Aplique as migrações no banco Turso **antes do primeiro deploy**, a
   partir da sua máquina, apontando temporariamente `TURSO_DATABASE_URL`/
   `TURSO_AUTH_TOKEN` do seu `.env` local para os valores do Turso:
   ```bash
   TURSO_DATABASE_URL=libsql://<seu-banco>.turso.io TURSO_AUTH_TOKEN=<token> npm run db:migrate
   TURSO_DATABASE_URL=libsql://<seu-banco>.turso.io TURSO_AUTH_TOKEN=<token> ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```
7. Faça o deploy normalmente (`vercel deploy` ou push para o repositório
   conectado). O app usará as variáveis de ambiente da Vercel em runtime.

Nunca commite `.env`, o arquivo `data/local.db` ou qualquer token/senha —
o `.gitignore` já cobre isso; `site/.env.example` só tem placeholders.

## Estrutura

```
site/
├── drizzle.config.ts        # configuração do Drizzle Kit (migrações)
├── vitest.config.mts        # configuração de testes
├── src/db/
│   ├── schema/               # tabelas (users, services, appointments, transactions, ...)
│   ├── migrations/           # migrações SQL geradas
│   ├── client.ts             # conexão libSQL + instância Drizzle (server-only)
│   ├── migrate.ts            # script: aplica migrações
│   └── seed.ts                # script: popula dados demo (idempotente)
├── src/lib/                  # lógica pura e testável (timezone, disponibilidade,
│   │                          financeiro, dinheiro, autenticação, csv, validação)
│   └── validation/            # schemas Zod
├── src/server/                # acesso a dados/regra de negócio (usa o banco)
├── src/app/
│   ├── actions/                # Server Actions (mutações: login, agendar, financeiro...)
│   ├── page.tsx                 # landing page pública
│   ├── agendar/                 # fluxo de agendamento do cliente
│   └── admin/
│       ├── login/                # login (fora do grupo protegido)
│       └── (protected)/          # visão geral, agenda, agendamentos, clientes,
│                                   # serviços, financeiro, configurações — todas
│                                   # atrás de `requireUser()` no servidor
├── src/components/             # componentes públicos (Header, Hero, ...)
│   └── admin/                    # componentes do painel (sidebar, gráficos, badges)
├── src/test/                   # setup de testes + teste de integração de ponta a ponta
└── public/assets/              # cópias locais dos assets de referência
```

Conteúdo de marca/marketing (textos do hero, FAQ, sobre a Ioná etc.)
continua centralizado em [`src/config/site.ts`](./src/config/site.ts).
Serviços, preços, agendamentos e financeiro agora vivem no banco de dados
e são editáveis pelo painel (`/admin/servicos`, `/admin/financeiro`,
`/admin/configuracoes`).

## Autenticação e segurança

- `/admin` (e todas as subrotas) exige sessão válida verificada **no
  servidor** — `src/app/admin/(protected)/layout.tsx` chama `requireUser()`
  em todo carregamento, então nada depende de esconder um link no
  frontend.
- Senha com hash bcrypt (custo 12), nunca armazenada em texto puro.
- Sessão via cookie `httpOnly`, `secure` em produção, `SameSite=Lax`,
  expira em 7 dias; token opaco de alta entropia gerado com
  `crypto.randomBytes`.
- `TURSO_AUTH_TOKEN` só é lido em `src/db/client.ts` (marcado
  `"server-only"`) — nunca chega ao bundle do navegador.
- Todo payload de formulário (agendamento público, serviços, financeiro,
  login) é validado com Zod em `src/lib/validation/`.
- O agendamento público tem rate limit (5 solicitações/minuto por IP,
  persistido no banco — funciona corretamente em ambiente serverless com
  múltiplas instâncias).
- Rotas públicas nunca expõem dados de clientes ou financeiro; notas
  internas de agendamento (`internalNote`) só aparecem no painel.

## Disponibilidade, fuso horário e conflitos

A lógica de disponibilidade (`src/lib/availability.ts` e
`src/lib/timezone.ts`) é pura e testada isoladamente:

- Fuso de negócio fixo: `America/Cuiaba`; todo timestamp é armazenado em
  UTC no banco e convertido na borda (exibição/formulário).
- Horário demo: segunda a sexta 09:00–18:00, sábado 09:00–13:00, domingo
  fechado — editável em `/admin/configuracoes`.
- Janela de agendamento: 60 dias a partir de hoje.
- Slots de 15 em 15 minutos; a duração do serviço precisa caber
  inteiramente dentro do expediente.
- Bloqueios de agenda e agendamentos `pending`/`confirmed`/`completed`
  ocupam o horário; `canceled`/`no_show` não contam.
- A criação de um agendamento (público ou manual) roda dentro de uma
  transação `BEGIN IMMEDIATE`, que revalida a disponibilidade no momento
  do `INSERT` — isso evita que duas solicitações simultâneas reservem o
  mesmo horário (nunca confia apenas na grade renderizada no navegador).

## Financeiro

- Todo valor monetário é armazenado e somado em **centavos** (inteiro),
  nunca `float`; formatado com `Intl.NumberFormat('pt-BR', {style:
  'currency', currency: 'BRL'})`.
- Fórmulas (`src/lib/finance.ts`): receita bruta = entradas pagas; saídas =
  despesas pagas; lucro líquido = receita − saídas; ticket médio = receita
  ÷ nº de entradas pagas; saldo a receber = valor pendente de agendamentos
  confirmados/concluídos.
- "Concluir agendamento" e "registrar pagamento" são ações **separadas** —
  concluir um atendimento nunca lança receita automaticamente.
- Registrar pagamento é idempotente: cada registro carrega uma
  `idempotencyKey` única; um duplo clique ou retry de rede não duplica a
  transação (coberto pelo teste de integração).

## Testes

```bash
npm run test
```

Cobrem: cálculo de slots e conflitos, conversão de fuso horário, dinheiro
em centavos, fórmulas financeiras, transições de status de agendamento,
validação de formulários (Zod), exportação CSV, hash de senha, e um teste
de integração de ponta a ponta (serviço → disponibilidade → agendamento →
conflito → conclusão → pagamento parcial e idempotente → resumo mensal)
rodando contra um banco SQLite real em memória.

## WhatsApp

Os CTAs usam o link público confirmado (`whatsapp.publicLink` em
`src/config/site.ts`) como fallback, pois o número direto do WhatsApp
Business da clínica ainda não foi informado. Assim que o número for
confirmado, preencha `whatsapp.directNumber` no mesmo arquivo — os botões
do site e a confirmação de agendamento passam a abrir automaticamente uma
conversa com a mensagem contextual (via `wa.me/<numero>?text=...`), sem
precisar alterar nenhum componente.

## Imagens

Todas as imagens usadas vêm de `public/assets/` (cópias locais dos
arquivos de `assets/` na raiz do repositório) e estão marcadas no
manifesto de origem como `reference_only_pending_authorization`. Veja
[`CONTENT_REVIEW.md`](./CONTENT_REVIEW.md) para a lista completa e o que
precisa ser aprovado antes de publicar.

## Pendências gerais

A lista completa de pendências comerciais (endereço, horários reais,
WhatsApp direto, preços reais, formação, autorização de imagens etc.)
está documentada em `PRD.md` (seção 10) e detalhada, com o que é
especificamente demo nesta versão com agendamento/gestão, em
[`CONTENT_REVIEW.md`](./CONTENT_REVIEW.md).
