import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { generateProtocol } from "../lib/protocol";
import { computePaymentStatus } from "../lib/finance";

const {
  users,
  services,
  businessHours,
  blockedPeriods,
  customers,
  appointments,
  appointmentEvents,
  transactions,
  settings,
} = schema;

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error("TURSO_DATABASE_URL não configurada (veja site/.env.example).");
}
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client, { schema });

const DAY_MS = 24 * 60 * 60 * 1000;
function utcNoon(daysFromToday: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(base.getTime() + daysFromToday * DAY_MS + 12 * 60 * 60 * 1000);
}

async function seedOwner() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL e ADMIN_PASSWORD precisam estar definidos no ambiente para o seed criar o usuário proprietário."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash, name: "Ioná Victório" })
      .where(eq(users.email, email));
    return existing[0].id;
  }

  const id = "seed-user-owner";
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: "Ioná Victório",
    role: "owner",
    createdAt: new Date(),
  });
  return id;
}

const DEMO_SERVICES = [
  {
    id: "seed-service-nano-fios",
    slug: "nano-fios",
    name: "Nano Fios / Nanopigmentação de sobrancelhas",
    description:
      "Técnica personalizada para valorizar o desenho e a expressão das sobrancelhas.",
    category: "sobrancelhas",
    durationMinutes: 150,
    priceCents: 65000,
    color: "#7E3948",
    imagePath: "/assets/asset_013_908c2b520eb77db1.jpg",
    sortOrder: 1,
  },
  {
    id: "seed-service-labial",
    slug: "micropigmentacao-labial",
    name: "Micropigmentação labial",
    description:
      "Procedimento labial pensado para valorizar o tom e o contorno dos lábios.",
    category: "labios",
    durationMinutes: 120,
    priceCents: 55000,
    color: "#B86F78",
    imagePath: "/assets/asset_011_b13b5a6a6ca17106.jpg",
    sortOrder: 2,
  },
  {
    id: "seed-service-neutralizacao",
    slug: "neutralizacao-labial",
    name: "Neutralização labial",
    description:
      "Nomenclatura observada no perfil da clínica; escopo exato ainda a confirmar com a profissional.",
    category: "labios",
    durationMinutes: 150,
    priceCents: 60000,
    color: "#B59668",
    imagePath: "/assets/asset_017_c033f5bfe6d5d666.jpg",
    sortOrder: 3,
  },
  {
    id: "seed-service-design",
    slug: "design-personalizado",
    name: "Design personalizado de sobrancelhas",
    description:
      "Atendimento voltado para encontrar um desenho que converse com o rosto e o estilo de cada cliente.",
    category: "sobrancelhas",
    durationMinutes: 45,
    priceCents: 9000,
    color: "#B86F78",
    imagePath: "/assets/asset_010_7a01c215ccc5d581.jpg",
    sortOrder: 4,
  },
  {
    id: "seed-service-retoque",
    slug: "retoque-nanopigmentacao",
    name: "Retoque de nanopigmentação",
    description: "Retoque de manutenção para clientes que já realizaram o Nano Fios.",
    category: "sobrancelhas",
    durationMinutes: 90,
    priceCents: 30000,
    color: "#7E3948",
    imagePath: "/assets/asset_013_908c2b520eb77db1.jpg",
    sortOrder: 5,
  },
] as const;

async function seedServices() {
  const now = new Date();
  for (const service of DEMO_SERVICES) {
    await db
      .insert(services)
      .values({
        ...service,
        active: true,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: services.slug,
        set: {
          name: service.name,
          description: service.description,
          category: service.category,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          color: service.color,
          imagePath: service.imagePath,
          sortOrder: service.sortOrder,
          updatedAt: now,
        },
      });
  }
}

async function seedBusinessHours() {
  // 0=domingo ... 6=sábado. Fechado no domingo; seg-sex 09:00-18:00; sáb 09:00-13:00.
  const rules = [
    { weekday: 0, isClosed: true, openMinute: null, closeMinute: null },
    { weekday: 1, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
    { weekday: 2, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
    { weekday: 3, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
    { weekday: 4, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
    { weekday: 5, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
    { weekday: 6, isClosed: false, openMinute: 9 * 60, closeMinute: 13 * 60 },
  ];
  for (const rule of rules) {
    await db
      .insert(businessHours)
      .values(rule)
      .onConflictDoUpdate({ target: businessHours.weekday, set: rule });
  }
}

async function seedBlockedPeriods() {
  const blocks = [
    {
      id: "seed-block-curso",
      startAt: utcNoon(10),
      endAt: new Date(utcNoon(10).getTime() + 3 * 60 * 60 * 1000),
      reason: "Curso de atualização profissional (demo)",
    },
    {
      id: "seed-block-folga",
      startAt: utcNoon(21),
      endAt: utcNoon(22),
      reason: "Dia de folga (demo)",
    },
  ];
  for (const block of blocks) {
    await db.insert(blockedPeriods).values({ ...block, createdAt: new Date() }).onConflictDoNothing();
  }
}

const DEMO_CUSTOMERS = [
  { id: "seed-customer-1", name: "Cliente Demonstração 1", whatsapp: "+55 65 90000-0001" },
  { id: "seed-customer-2", name: "Cliente Demonstração 2", whatsapp: "+55 65 90000-0002" },
  { id: "seed-customer-3", name: "Cliente Demonstração 3", whatsapp: "+55 65 90000-0003" },
  { id: "seed-customer-4", name: "Cliente Demonstração 4", whatsapp: "+55 65 90000-0004" },
  { id: "seed-customer-5", name: "Cliente Demonstração 5", whatsapp: "+55 65 90000-0005" },
  { id: "seed-customer-6", name: "Cliente Demonstração 6", whatsapp: "+55 65 90000-0006" },
] as const;

async function seedCustomers() {
  const now = new Date();
  for (const customer of DEMO_CUSTOMERS) {
    await db
      .insert(customers)
      .values({ ...customer, isDemo: true, createdAt: now, updatedAt: now })
      .onConflictDoNothing();
  }
}

type DemoAppointmentSpec = {
  id: string;
  customerId: string;
  service: (typeof DEMO_SERVICES)[number];
  daysFromToday: number;
  hour: number;
  status: schema.AppointmentStatus;
  paidCents: number;
  origin: schema.AppointmentOrigin;
};

function buildAppointmentSpecs(): DemoAppointmentSpec[] {
  const svc = (slug: string) => DEMO_SERVICES.find((s) => s.slug === slug)!;

  return [
    {
      id: "seed-appt-past-completed-paid",
      customerId: "seed-customer-1",
      service: svc("nano-fios"),
      daysFromToday: -20,
      hour: 10,
      status: "completed",
      paidCents: svc("nano-fios").priceCents,
      origin: "whatsapp",
    },
    {
      id: "seed-appt-past-completed-partial",
      customerId: "seed-customer-2",
      service: svc("micropigmentacao-labial"),
      daysFromToday: -15,
      hour: 13,
      status: "completed",
      paidCents: 20000,
      origin: "instagram",
    },
    {
      id: "seed-appt-past-noshow",
      customerId: "seed-customer-3",
      service: svc("design-personalizado"),
      daysFromToday: -8,
      hour: 15,
      status: "no_show",
      paidCents: 0,
      origin: "site",
    },
    {
      id: "seed-appt-past-canceled",
      customerId: "seed-customer-4",
      service: svc("retoque-nanopigmentacao"),
      daysFromToday: -5,
      hour: 11,
      status: "canceled",
      paidCents: 0,
      origin: "telefone",
    },
    {
      id: "seed-appt-future-confirmed",
      customerId: "seed-customer-5",
      service: svc("neutralizacao-labial"),
      daysFromToday: 3,
      hour: 9,
      status: "confirmed",
      paidCents: 0,
      origin: "site",
    },
    {
      id: "seed-appt-future-confirmed-signal",
      customerId: "seed-customer-6",
      service: svc("nano-fios"),
      daysFromToday: 5,
      hour: 10,
      status: "confirmed",
      paidCents: 15000,
      origin: "whatsapp",
    },
    {
      id: "seed-appt-future-pending",
      customerId: "seed-customer-1",
      service: svc("design-personalizado"),
      daysFromToday: 7,
      hour: 14,
      status: "pending",
      paidCents: 0,
      origin: "site",
    },
    {
      id: "seed-appt-today-pending",
      customerId: "seed-customer-2",
      service: svc("retoque-nanopigmentacao"),
      daysFromToday: 0,
      hour: 16,
      status: "pending",
      paidCents: 0,
      origin: "presencial",
    },
  ];
}

function startOfBusinessDayUtc(daysFromToday: number, hour: number): { startAtUtc: Date } {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // America/Cuiaba = UTC-4 o ano todo (sem horário de verão desde 2019).
  const startAtUtc = new Date(base.getTime() + daysFromToday * DAY_MS + (hour + 4) * 60 * 60 * 1000);
  return { startAtUtc };
}

async function seedAppointmentsAndPayments(ownerId: string) {
  const now = new Date();
  const specs = buildAppointmentSpecs();

  for (const spec of specs) {
    const { startAtUtc } = startOfBusinessDayUtc(spec.daysFromToday, spec.hour);
    const endAtUtc = new Date(startAtUtc.getTime() + spec.service.durationMinutes * 60_000);
    const paymentStatus = computePaymentStatus(spec.service.priceCents, spec.paidCents);

    const inserted = await db
      .insert(appointments)
      .values({
        id: spec.id,
        protocol: generateProtocol(startAtUtc),
        customerId: spec.customerId,
        serviceId: spec.service.id,
        serviceNameSnapshot: spec.service.name,
        serviceDurationSnapshot: spec.service.durationMinutes,
        servicePriceSnapshot: spec.service.priceCents,
        startAtUtc,
        endAtUtc,
        timezone: "America/Cuiaba",
        status: spec.status,
        paymentStatus,
        origin: spec.origin,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: appointments.id });

    if (inserted.length === 0) continue; // já existia (seed idempotente)

    await db.insert(appointmentEvents).values({
      id: `${spec.id}-event-created`,
      appointmentId: spec.id,
      fromStatus: null,
      toStatus: "pending",
      note: "Agendamento criado (seed demo).",
      createdByUserId: ownerId,
      createdAt: now,
    });

    if (spec.status !== "pending") {
      await db.insert(appointmentEvents).values({
        id: `${spec.id}-event-status`,
        appointmentId: spec.id,
        fromStatus: "pending",
        toStatus: spec.status,
        note: "Status atualizado (seed demo).",
        createdByUserId: ownerId,
        createdAt: now,
      });
    }

    if (spec.paidCents > 0) {
      await db.insert(transactions).values({
        id: `${spec.id}-payment`,
        type: "income",
        amountCents: spec.paidCents,
        financialDate: startAtUtc,
        category: "servico",
        description: `Pagamento — ${spec.service.name}`,
        paymentMethod: "pix",
        status: "paid",
        appointmentId: spec.id,
        serviceId: spec.service.id,
        createdByUserId: ownerId,
        idempotencyKey: `seed:${spec.id}:payment`,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

type DemoTransactionSpec = {
  id: string;
  type: schema.TransactionType;
  amountCents: number;
  daysFromToday: number;
  category: string;
  description: string;
  paymentMethod: schema.PaymentMethod;
  status: schema.TransactionStatus;
};

function monthlyExpenseSet(monthOffset: number): DemoTransactionSpec[] {
  const base = monthOffset * 30;
  return [
    {
      id: `seed-tx-materiais-${monthOffset}`,
      type: "expense",
      amountCents: 35000 + monthOffset * 1500,
      daysFromToday: -(base + 2),
      category: "materiais",
      description: "Compra de insumos e agulhas",
      paymentMethod: "cartao",
      status: "paid",
    },
    {
      id: `seed-tx-aluguel-${monthOffset}`,
      type: "expense",
      amountCents: 80000,
      daysFromToday: -(base + 5),
      category: "aluguel",
      description: "Aluguel do studio",
      paymentMethod: "transferencia",
      status: "paid",
    },
    {
      id: `seed-tx-marketing-${monthOffset}`,
      type: "expense",
      amountCents: 12000,
      daysFromToday: -(base + 8),
      category: "marketing",
      description: "Impulsionamento de posts",
      paymentMethod: "cartao",
      status: "paid",
    },
    {
      id: `seed-tx-servico-extra-${monthOffset}`,
      type: "income",
      amountCents: 55000,
      daysFromToday: -(base + 12),
      category: "servico",
      description: "Atendimento avulso (demo, sem agendamento vinculado)",
      paymentMethod: "pix",
      status: "paid",
    },
    {
      id: `seed-tx-sinal-${monthOffset}`,
      type: "income",
      amountCents: 15000,
      daysFromToday: -(base + 18),
      category: "sinal",
      description: "Sinal de agendamento futuro (demo)",
      paymentMethod: "pix",
      status: "paid",
    },
  ];
}

async function seedTransactions(ownerId: string) {
  const now = new Date();
  const specs = [0, 1, 2].flatMap((monthOffset) => monthlyExpenseSet(monthOffset));

  for (const spec of specs) {
    await db
      .insert(transactions)
      .values({
        id: spec.id,
        type: spec.type,
        amountCents: spec.amountCents,
        financialDate: utcNoon(spec.daysFromToday),
        category: spec.category,
        description: spec.description,
        paymentMethod: spec.paymentMethod,
        status: spec.status,
        createdByUserId: ownerId,
        idempotencyKey: `seed:${spec.id}`,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

async function seedSettings() {
  await db
    .insert(settings)
    .values({ key: "autoConfirmAppointments", value: "false" })
    .onConflictDoNothing();
}

async function main() {
  const includeDemo = process.argv.includes("--demo");

  console.log("Seed: criando/atualizando usuário proprietário...");
  const ownerId = await seedOwner();

  console.log("Seed: horários de funcionamento...");
  await seedBusinessHours();

  console.log("Seed: configurações padrão...");
  await seedSettings();

  if (includeDemo) {
    console.log("Seed: serviços demo...");
    await seedServices();
    console.log("Seed: bloqueios de agenda...");
    await seedBlockedPeriods();
    console.log("Seed: clientes demo...");
    await seedCustomers();
    console.log("Seed: agendamentos e pagamentos demo...");
    await seedAppointmentsAndPayments(ownerId);
    console.log("Seed: lançamentos financeiros demo (3 meses)...");
    await seedTransactions(ownerId);
  }

  console.log("Seed concluído com sucesso.");
  client.close();
}

main().catch((error) => {
  console.error("Falha ao rodar o seed:", error);
  process.exit(1);
});
