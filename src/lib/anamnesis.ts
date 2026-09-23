import { isCanonicalWhatsapp, maskWhatsapp, whatsappToCanonical } from "@/lib/masks";

export const HEALTH_ITEMS = [
  { key: "cardiopatia", label: "Cardiopatia", risk: false },
  { key: "dermatites", label: "Dermatites", risk: false },
  { key: "hemofilia", label: "Hemofilia", risk: true },
  { key: "diabetes", label: "Diabetes", risk: false },
  { key: "vitiligo", label: "Vitiligo", risk: false },
  { key: "psoriase", label: "Psoríase", risk: false },
  { key: "queloide", label: "Queloide", risk: true },
  { key: "depressao", label: "Depressão", risk: false },
  { key: "alergias", label: "Alergias", risk: false },
  { key: "lupus", label: "Lupus", risk: false },
  { key: "botox", label: "Botox", risk: false },
  { key: "tireoide", label: "Tireoide", risk: false },
  { key: "tpmColica", label: "TPM/Cólica", risk: false },
  { key: "menstruacao", label: "Menstruação", risk: false },
  { key: "hipotensao", label: "Hipotensão", risk: false },
  { key: "hipertensao", label: "Hipertensão", risk: false },
  { key: "anemia", label: "Anemia", risk: false },
  { key: "blefarite", label: "Blefarite", risk: false },
  { key: "herpes", label: "Herpes", risk: true },
  { key: "hiv", label: "HIV", risk: false },
  { key: "fumante", label: "Fumante", risk: false },
  { key: "gestante", label: "Gestante", risk: true },
  { key: "epilepsia", label: "Epilepsia", risk: false },
  { key: "tratamentoAcido", label: "Tratamento com ácido", risk: true },
  { key: "blefaroplastia", label: "Blefaroplastia", risk: false },
  { key: "antibiotico", label: "Antibiótico nos últimos 6 dias", risk: true },
] as const;

export type HealthKey = (typeof HEALTH_ITEMS)[number]["key"];

export type HealthFlag = { checked: boolean; note: string };

export const REFERRAL_OPTIONS = [
  { value: "internet", label: "Internet/Instagram" },
  { value: "indicacao", label: "Indicação" },
  { value: "outros", label: "Outros" },
] as const;

export type ReferralValue = "" | (typeof REFERRAL_OPTIONS)[number]["value"];

export const PROCEDURE_OPTIONS = [
  { value: "sobrancelhas", label: "Sobrancelhas" },
  { value: "labios", label: "Lábios" },
  { value: "olhos", label: "Olhos" },
  { value: "outro", label: "Outro" },
] as const;

export type ProcedureValue = (typeof PROCEDURE_OPTIONS)[number]["value"];

export const ORIENTATIONS = [
  "Medicamentos, disfunções hormonais, doenças de pele e tipo de pele podem interferir no resultado.",
  "Podem surgir edema, coceira, irritação e sensibilidade, o que é normal se os cuidados forem seguidos.",
  "Não friccionar nem forçar a descamação.",
  "Higienizar com sabonete facial.",
  "Usar a pomada indicada pelo tempo recomendado.",
  "Evitar sol, praia e piscina por pelo menos 15 dias.",
  "Evitar cosméticos com ácidos na área.",
  "Se os sintomas persistirem mesmo com os cuidados, procurar orientação médica.",
] as const;

export const AUTHORIZATION_ITEMS = [
  { key: "photos", label: "Autorizo fotos de antes e depois para avaliação, documentação e portfólio comercial." },
  { key: "hygiene", label: "Procedimento e material em conformidade com higiene e segurança." },
  { key: "notRiskGroup", label: "Declaro não fazer parte do grupo de risco." },
  { key: "willFollowCare", label: "Cuidarei conforme o recomendado." },
  { key: "doubtsClarified", label: "Minhas dúvidas foram esclarecidas." },
] as const;

export type AuthorizationKey = (typeof AUTHORIZATION_ITEMS)[number]["key"];

export const CONSENT_ITEMS = [
  {
    key: "informed",
    label:
      "Fui informada sobre a natureza do procedimento, objetivos, técnicas, riscos, efeitos colaterais e cuidados pós.",
  },
  {
    key: "sideEffects",
    label:
      "Estou ciente de que podem ocorrer vermelhidão, inchaço, descamação, alteração de cor ou necessidade de retoque.",
  },
  {
    key: "disclosedConditions",
    label:
      "Informei à profissional qualquer alergia, queloide, medicação, problema de pele, gravidez, lactação ou outra condição relevante.",
  },
  {
    key: "individualResult",
    label: "Reconheço que o resultado varia conforme a pele, os cuidados pós e a resposta individual.",
  },
  {
    key: "aftercare",
    label: "Recebi orientações de higiene, manutenção e produtos recomendados e me comprometo a segui-las.",
  },
  {
    key: "authorizeProcedure",
    label:
      "Autorizo a profissional a realizar o procedimento e me responsabilizo por informar qualquer alteração de saúde antes de sessões futuras.",
  },
] as const;

export type ConsentKey = (typeof CONSENT_ITEMS)[number]["key"];

export const FINAL_DECLARATION =
  "Declaro ter compreendido todas as informações acima e concordo voluntariamente com a realização do procedimento.";

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type AnamnesisPayload = {
  client: {
    name: string;
    birthDate: string;
    rg: string;
    cpf: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  };
  referral: ReferralValue;
  referralOther: string;
  procedures: ProcedureValue[];
  procedureOther: string;
  pigment: { brand: string; colors: string[] };
  needle: { type: string; speed: string };
  health: Record<HealthKey, HealthFlag>;
  medications: string;
  lactation: HealthFlag;
  otherConditions: string;
  fitForProcedure: "" | "yes" | "no";
  fitNotes: string;
  authorization: Record<AuthorizationKey, boolean>;
  consent: Record<ConsentKey, boolean>;
  finalDeclaration: boolean;
  clientSignature: string;
  professionalSignature: string;
  signedAt: string;
};

export type CustomerIdentity = {
  name: string;
  whatsapp: string;
  birthDate: string | null;
  rg: string | null;
  cpf: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

function emptyFlag(): HealthFlag {
  return { checked: false, note: "" };
}

function emptyHealth(): Record<HealthKey, HealthFlag> {
  return Object.fromEntries(HEALTH_ITEMS.map((item) => [item.key, emptyFlag()])) as Record<HealthKey, HealthFlag>;
}

function emptyChecks<T extends string>(keys: readonly T[]): Record<T, boolean> {
  return Object.fromEntries(keys.map((key) => [key, false])) as Record<T, boolean>;
}

export function emptyAnamnesis(): AnamnesisPayload {
  return {
    client: {
      name: "",
      birthDate: "",
      rg: "",
      cpf: "",
      address: "",
      city: "",
      state: "",
      phone: "",
    },
    referral: "",
    referralOther: "",
    procedures: [],
    procedureOther: "",
    pigment: { brand: "", colors: [""] },
    needle: { type: "", speed: "" },
    health: emptyHealth(),
    medications: "",
    lactation: emptyFlag(),
    otherConditions: "",
    fitForProcedure: "",
    fitNotes: "",
    authorization: emptyChecks(AUTHORIZATION_ITEMS.map((item) => item.key)),
    consent: emptyChecks(CONSENT_ITEMS.map((item) => item.key)),
    finalDeclaration: false,
    clientSignature: "",
    professionalSignature: "",
    signedAt: "",
  };
}

function prefer(stored: string | null | undefined, fallback: string): string {
  const value = stored?.trim() ?? "";
  return value || fallback;
}

function applyCustomer(payload: AnamnesisPayload, customer: CustomerIdentity): AnamnesisPayload {
  return {
    ...payload,
    client: {
      ...payload.client,
      name: prefer(customer.name, payload.client.name),
      birthDate: prefer(customer.birthDate, payload.client.birthDate),
      rg: prefer(customer.rg, payload.client.rg),
      cpf: prefer(customer.cpf, payload.client.cpf),
      address: prefer(customer.address, payload.client.address),
      city: prefer(customer.city, payload.client.city),
      state: prefer(customer.state, payload.client.state),
      phone: customer.whatsapp ? maskWhatsapp(customer.whatsapp) : payload.client.phone,
    },
  };
}

function copyHistory(previous: AnamnesisPayload): AnamnesisPayload {
  const fresh = emptyAnamnesis();
  return {
    ...fresh,
    client: { ...previous.client },
    referral: previous.referral,
    referralOther: previous.referralOther,
    procedures: [...previous.procedures],
    procedureOther: previous.procedureOther,
    health: Object.fromEntries(
      HEALTH_ITEMS.map((item) => [item.key, { ...previous.health[item.key] }])
    ) as Record<HealthKey, HealthFlag>,
    medications: previous.medications,
    lactation: { ...previous.lactation },
    otherConditions: previous.otherConditions,
  };
}

export function buildPrefill(input: {
  customer: CustomerIdentity;
  current: AnamnesisPayload | null;
  previous: AnamnesisPayload | null;
}): AnamnesisPayload {
  if (input.current) return input.current;
  const base = input.previous ? copyHistory(input.previous) : emptyAnamnesis();
  return applyCustomer(base, input.customer);
}

export function activeRiskLabels(payload: AnamnesisPayload): string[] {
  return HEALTH_ITEMS.filter((item) => item.risk && payload.health[item.key]?.checked).map((item) => item.label);
}

export function termsAccepted(payload: AnamnesisPayload): boolean {
  const authorization = AUTHORIZATION_ITEMS.every((item) => payload.authorization[item.key]);
  const consent = CONSENT_ITEMS.every((item) => payload.consent[item.key]);
  return authorization && consent && payload.finalDeclaration;
}

export function continueSectionError(section: number, payload: AnamnesisPayload): string | null {
  if (section === 0 && payload.client.name.trim().length < 2) return "Informe o nome da cliente.";
  if (section === 0 && !isCanonicalWhatsapp(whatsappToCanonical(payload.client.phone))) {
    return "Informe um telefone válido, com DDD.";
  }
  if (section === 1 && payload.procedures.length === 0) return "Selecione ao menos um tipo de procedimento.";
  if (section === 1 && payload.procedures.includes("outro") && !payload.procedureOther.trim()) {
    return "Descreva o outro procedimento.";
  }
  if (section === 5 && !termsAccepted(payload)) return "Os aceites dos termos são obrigatórios para avançar.";
  return null;
}

export function referralLabel(value: ReferralValue): string {
  return REFERRAL_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

export function procedureLabel(value: ProcedureValue): string {
  return PROCEDURE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
