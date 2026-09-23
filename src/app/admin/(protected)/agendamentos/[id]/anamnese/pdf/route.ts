import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildAnamnesisPdf } from "@/lib/anamnesis-pdf";
import { formatZonedDateTime } from "@/lib/timezone";
import { getAnamnesisPdfSource } from "@/server/anamnesis";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const source = await getAnamnesisPdfSource(id);
  if (!source) return new NextResponse("Anamnese não encontrada", { status: 404 });

  const bytes = await buildAnamnesisPdf({
    payload: source.payload,
    protocol: source.protocol,
    serviceName: source.serviceName,
    appointmentDateLabel: formatZonedDateTime(source.startAtUtc),
    professionalName: user.name,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="anamnese-${source.protocol}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
