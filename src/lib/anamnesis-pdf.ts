import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import {
  AUTHORIZATION_ITEMS,
  CONSENT_ITEMS,
  FINAL_DECLARATION,
  HEALTH_ITEMS,
  ORIENTATIONS,
  activeRiskLabels,
  procedureLabel,
  referralLabel,
  type AnamnesisPayload,
} from "@/lib/anamnesis";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const WINE = rgb(0.494, 0.224, 0.282);
const INK = rgb(0.169, 0.125, 0.133);
const MUTED = rgb(0.42, 0.33, 0.35);
const CREAM = rgb(0.98, 0.965, 0.953);
const WHITE = rgb(1, 1, 1);

type Pen = {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

function newPage(pen: Pen) {
  pen.page = pen.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pen.page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: CREAM });
  pen.y = PAGE_HEIGHT - MARGIN;
}

function ensure(pen: Pen, height: number) {
  if (pen.y - height >= MARGIN) return;
  newPage(pen);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function paragraph(pen: Pen, text: string, size = 10, font = pen.font, color = INK) {
  const safe = text.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^\n\r\t\u0020-\u00FF]/g, "");
  const lines = wrap(safe, font, size, PAGE_WIDTH - MARGIN * 2);
  ensure(pen, lines.length * (size + 4) + 4);
  for (const line of lines) {
    pen.page.drawText(line, { x: MARGIN, y: pen.y, size, font, color });
    pen.y -= size + 4;
  }
}

function heading(pen: Pen, text: string) {
  ensure(pen, 28);
  pen.y -= 8;
  pen.page.drawText(text, { x: MARGIN, y: pen.y, size: 13, font: pen.bold, color: WINE });
  pen.y -= 18;
}

function line(pen: Pen, label: string, value: string) {
  const text = value.trim() ? `${label}: ${value.trim()}` : `${label}: -`;
  paragraph(pen, text, 10);
}

async function signature(pen: Pen, label: string, dataUrl: string) {
  ensure(pen, 96);
  pen.page.drawText(label, { x: MARGIN, y: pen.y, size: 10, font: pen.bold, color: INK });
  pen.y -= 64;
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    pen.page.drawText("Sem assinatura", { x: MARGIN, y: pen.y + 24, size: 10, font: pen.font, color: MUTED });
    pen.y -= 8;
    return;
  }
  try {
    const bytes = Uint8Array.from(Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64"));
    const image = await pen.doc.embedPng(bytes);
    pen.page.drawImage(image, { x: MARGIN, y: pen.y, width: 200, height: 56 });
  } catch {
    pen.page.drawText("Assinatura ilegível", { x: MARGIN, y: pen.y + 24, size: 10, font: pen.font, color: MUTED });
  }
  pen.y -= 12;
}

function checkedHealth(payload: AnamnesisPayload): string[] {
  const rows = HEALTH_ITEMS.filter((item) => payload.health[item.key]?.checked).map((item) => {
    const note = payload.health[item.key].note.trim();
    return note ? `${item.label} (${note})` : item.label;
  });
  if (payload.lactation.checked) {
    const note = payload.lactation.note.trim();
    rows.push(note ? `Lactação (${note})` : "Lactação");
  }
  return rows;
}

export async function buildAnamnesisPdf(input: {
  payload: AnamnesisPayload;
  protocol: string;
  serviceName: string;
  appointmentDateLabel: string;
  professionalName: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const pen: Pen = {
    doc,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT,
  };
  pen.page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: CREAM });
  pen.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 78, width: PAGE_WIDTH, height: 78, color: WINE });
  pen.page.drawText("Bendita Micro", { x: MARGIN, y: PAGE_HEIGHT - 36, size: 20, font: pen.bold, color: WHITE });
  pen.page.drawText("Ficha de anamnese", { x: MARGIN, y: PAGE_HEIGHT - 56, size: 12, font: pen.font, color: WHITE });
  pen.y = PAGE_HEIGHT - 100;

  paragraph(pen, `Protocolo ${input.protocol} · ${input.serviceName}`, 10, pen.bold);
  paragraph(pen, input.appointmentDateLabel, 10, pen.font, MUTED);
  paragraph(pen, `Profissional: ${input.professionalName}`, 10, pen.font, MUTED);

  const client = input.payload.client;
  heading(pen, "Dados da cliente");
  line(pen, "Nome", client.name);
  line(pen, "Nascimento", client.birthDate.split("-").reverse().join("/"));
  line(pen, "RG", client.rg);
  line(pen, "CPF", client.cpf);
  line(pen, "Endereço", client.address);
  line(pen, "Cidade/UF", [client.city, client.state].filter(Boolean).join("/"));
  line(pen, "Telefone/WhatsApp", client.phone);

  heading(pen, "Procedimento");
  const referral = referralLabel(input.payload.referral);
  line(pen, "Como conheceu", input.payload.referral === "outros" ? input.payload.referralOther || "Outros" : referral);
  const procedures = input.payload.procedures.map((value) =>
    value === "outro" ? input.payload.procedureOther || "Outro" : procedureLabel(value)
  );
  line(pen, "Tipo", procedures.join(", "));
  line(pen, "Pigmento", input.payload.pigment.brand);
  line(pen, "Cores", input.payload.pigment.colors.filter(Boolean).join(", "));
  line(pen, "Agulha", input.payload.needle.type);
  line(pen, "Velocidade", input.payload.needle.speed);

  heading(pen, "Histórico de saúde");
  const health = checkedHealth(input.payload);
  paragraph(pen, health.length > 0 ? health.join("; ") : "Nenhuma condição marcada.");
  line(pen, "Medicamentos", input.payload.medications);
  line(pen, "Outras condições", input.payload.otherConditions);

  const risks = activeRiskLabels(input.payload);
  if (risks.length > 0) {
    heading(pen, "Alerta de contraindicação");
    paragraph(
      pen,
      `Itens de risco marcados: ${risks.join(", ")}. O sistema apenas alerta. A decisão é da profissional.`
    );
  }

  heading(pen, "Aptidão");
  const fit =
    input.payload.fitForProcedure === "yes"
      ? "Cliente apta a realizar o procedimento."
      : input.payload.fitForProcedure === "no"
        ? "Cliente não apta a realizar o procedimento."
        : "Decisão não registrada.";
  paragraph(pen, fit, 10, pen.bold);
  if (input.payload.fitNotes.trim()) line(pen, "Observações", input.payload.fitNotes);

  heading(pen, "Orientações");
  for (const item of ORIENTATIONS) paragraph(pen, `- ${item}`);

  heading(pen, "Termo de autorização");
  for (const item of AUTHORIZATION_ITEMS) {
    const mark = input.payload.authorization[item.key] ? "[x]" : "[ ]";
    paragraph(pen, `${mark} ${item.label}`);
  }

  heading(pen, "Termo de consentimento");
  for (const item of CONSENT_ITEMS) {
    const mark = input.payload.consent[item.key] ? "[x]" : "[ ]";
    paragraph(pen, `${mark} ${item.label}`);
  }
  paragraph(pen, input.payload.finalDeclaration ? `[x] ${FINAL_DECLARATION}` : `[ ] ${FINAL_DECLARATION}`, 10, pen.bold);

  heading(pen, "Assinaturas");
  const signed = input.payload.signedAt.split("-").reverse().join("/");
  paragraph(pen, `Data: ${signed || "-"}`);
  await signature(pen, "Cliente", input.payload.clientSignature);
  await signature(pen, "Profissional", input.payload.professionalSignature);

  ensure(pen, 24);
  paragraph(pen, "Documento montado a partir da ficha salva. Uso interno da Bendita Micro.", 8, pen.font, MUTED);

  return doc.save();
}
