import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray, like } from "drizzle-orm";
import * as schema from "./schema";

const { appointments, appointmentEvents, customers, services, transactions, blockedPeriods } = schema;

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error("TURSO_DATABASE_URL não configurada (veja site/.env.example).");
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client, { schema });

async function main() {
  const demoAppointments = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.isDemo, true));
  const appointmentIds = demoAppointments.map((row) => row.id);

  const removedTransactions = await db
    .delete(transactions)
    .where(eq(transactions.isDemo, true))
    .returning({ id: transactions.id });

  if (appointmentIds.length > 0) {
    await db.delete(transactions).where(inArray(transactions.appointmentId, appointmentIds));
    await db.delete(appointmentEvents).where(inArray(appointmentEvents.appointmentId, appointmentIds));
    await db.delete(appointments).where(inArray(appointments.id, appointmentIds));
  }

  const removedCustomers = await db
    .delete(customers)
    .where(eq(customers.isDemo, true))
    .returning({ id: customers.id });

  const removedServices = await db
    .delete(services)
    .where(eq(services.isDemo, true))
    .returning({ id: services.id });

  const removedBlocks = await db
    .delete(blockedPeriods)
    .where(like(blockedPeriods.id, "seed-block-%"))
    .returning({ id: blockedPeriods.id });

  console.log(
    `Demo removido: ${appointmentIds.length} agendamentos, ${removedCustomers.length} clientes, ${removedServices.length} serviços, ${removedTransactions.length} lançamentos, ${removedBlocks.length} bloqueios.`
  );
  client.close();
}

main().catch((error) => {
  console.error("Falha ao remover dados de demonstração:", error);
  process.exit(1);
});
