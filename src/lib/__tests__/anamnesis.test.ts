import { describe, expect, it } from "vitest";
import {
  activeRiskLabels,
  buildPrefill,
  continueSectionError,
  emptyAnamnesis,
  termsAccepted,
  type CustomerIdentity,
} from "../anamnesis";
import { anamnesisCompleteSchema, anamnesisPayloadSchema } from "../validation/anamnesis";
import { buildAnamnesisPdf } from "../anamnesis-pdf";

const customer: CustomerIdentity = {
  name: "Ana Souza",
  whatsapp: "5565999990000",
  birthDate: "1990-01-15",
  rg: "1234567",
  cpf: "123.456.789-00",
  address: "Rua das Flores, 10",
  city: "Cuiabá",
  state: "MT",
};

describe("pré-preenchimento da anamnese", () => {
  it("copia o histórico anterior e pede novos aceites e assinaturas", () => {
    const previous = emptyAnamnesis();
    previous.client.name = "Nome antigo";
    previous.health.gestante = { checked: true, note: "12 semanas" };
    previous.medications = "Vitamina";
    previous.procedures = ["labios"];
    previous.authorization.photos = true;
    previous.finalDeclaration = true;
    previous.clientSignature = "data:image/png;base64,abc";
    previous.fitForProcedure = "yes";
    previous.pigment.brand = "Marca antiga";

    const next = buildPrefill({ customer, current: null, previous });

    expect(next.client.name).toBe("Ana Souza");
    expect(next.client.phone).toBe("(65) 99999-0000");
    expect(next.health.gestante).toEqual({ checked: true, note: "12 semanas" });
    expect(next.medications).toBe("Vitamina");
    expect(next.procedures).toEqual(["labios"]);
    expect(next.authorization.photos).toBe(false);
    expect(next.finalDeclaration).toBe(false);
    expect(next.clientSignature).toBe("");
    expect(next.fitForProcedure).toBe("");
    expect(next.pigment.brand).toBe("");
  });

  it("retoma a ficha já salva neste atendimento", () => {
    const current = emptyAnamnesis();
    current.pigment.brand = "Desta sessão";
    current.clientSignature = "data:image/png;base64,abc";
    const next = buildPrefill({ customer, current, previous: null });
    expect(next.pigment.brand).toBe("Desta sessão");
    expect(next.clientSignature).toBe("data:image/png;base64,abc");
  });
});

describe("alertas e validação", () => {
  it("lista só os itens de risco marcados", () => {
    const payload = emptyAnamnesis();
    payload.health.queloide.checked = true;
    payload.health.diabetes.checked = true;
    payload.health.herpes.checked = true;
    expect(activeRiskLabels(payload)).toEqual(["Queloide", "Herpes"]);
  });

  it("exige nome, telefone, procedimento e termos para avançar", () => {
    const payload = emptyAnamnesis();
    expect(continueSectionError(0, payload)).toBe("Informe o nome da cliente.");
    payload.client.name = "Ana Souza";
    payload.client.phone = "(65) 99999-0000";
    expect(continueSectionError(0, payload)).toBeNull();
    expect(continueSectionError(1, payload)).toBe("Selecione ao menos um tipo de procedimento.");
    payload.procedures = ["sobrancelhas"];
    expect(continueSectionError(1, payload)).toBeNull();
    expect(continueSectionError(5, payload)).toMatch(/termos/);
    expect(termsAccepted(payload)).toBe(false);
  });

  it("aceita rascunho incompleto e bloqueia conclusão sem assinatura", () => {
    const payload = emptyAnamnesis();
    expect(anamnesisPayloadSchema.safeParse(payload).success).toBe(true);
    const completed = anamnesisCompleteSchema.safeParse({
      ...payload,
      client: { ...payload.client, name: "Ana Souza", phone: "(65) 99999-0000" },
      procedures: ["olhos"],
    });
    expect(completed.success).toBe(false);
  });
});

describe("pdf da anamnese", () => {
  it("monta o arquivo a partir dos dados, sem gravar o pdf", async () => {
    const payload = emptyAnamnesis();
    payload.client.name = "Ioná Cliente";
    payload.client.city = "Cuiabá";
    payload.health.gestante = { checked: true, note: "atenção" };
    payload.procedures = ["sobrancelhas"];
    const bytes = await buildAnamnesisPdf({
      payload,
      protocol: "BM-1",
      serviceName: "Nano fios",
      appointmentDateLabel: "23/09/2026 14:00",
      professionalName: "Ioná Victório",
    });
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });
});
