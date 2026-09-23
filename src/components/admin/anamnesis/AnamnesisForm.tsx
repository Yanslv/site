"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { saveAnamnesisAction } from "@/app/actions/admin-anamnesis";
import { SignaturePad } from "@/components/admin/anamnesis/SignaturePad";
import {
  AUTHORIZATION_ITEMS,
  BRAZIL_STATES,
  CONSENT_ITEMS,
  FINAL_DECLARATION,
  HEALTH_ITEMS,
  ORIENTATIONS,
  PROCEDURE_OPTIONS,
  REFERRAL_OPTIONS,
  activeRiskLabels,
  continueSectionError,
  maskCpf,
  type AnamnesisPayload,
  type AuthorizationKey,
  type ConsentKey,
  type HealthFlag,
  type HealthKey,
  type ProcedureValue,
  type ReferralValue,
} from "@/lib/anamnesis";
import { maskWhatsapp } from "@/lib/masks";
import { todayDateKey } from "@/lib/timezone";

const SECTIONS = [
  "Dados da cliente",
  "Como conheceu e procedimento",
  "Dados do procedimento",
  "Histórico de saúde",
  "Orientações",
  "Termos",
  "Aptidão e assinaturas",
] as const;

const fieldClass =
  "w-full rounded-xl border border-surface bg-background px-3 py-3 text-base text-ink focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20";

function formatDateKey(key: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return "preenchida ao salvar";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
    </label>
  );
}

function CheckRow({
  label,
  checked,
  note,
  onChecked,
  onNote,
}: {
  label: string;
  checked: boolean;
  note?: string;
  onChecked: (checked: boolean) => void;
  onNote?: (note: string) => void;
}) {
  return (
    <div className="rounded-xl border border-surface px-3 py-3">
      <label className="flex items-start gap-3 text-sm leading-snug text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChecked(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-wine"
        />
        <span>{label}</span>
      </label>
      {checked && onNote && (
        <input
          value={note ?? ""}
          onChange={(event) => onNote(event.target.value)}
          placeholder="Observação (opcional)"
          className={`${fieldClass} mt-2`}
        />
      )}
    </div>
  );
}

function RiskAlert({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-wine bg-rose/15 px-3 py-3 text-sm leading-relaxed text-ink">
      <p className="font-semibold text-wine">Alerta de contraindicação</p>
      <p>
        Marcado: {labels.join(", ")}. O sistema apenas alerta. A decisão de realizar o procedimento é sempre da
        profissional.
      </p>
    </div>
  );
}

export function AnamnesisForm({
  appointmentId,
  serviceName,
  whenLabel,
  initialPayload,
  initialStatus,
}: {
  appointmentId: string;
  serviceName: string;
  whenLabel: string;
  initialPayload: AnamnesisPayload;
  initialStatus: "draft" | "completed" | null;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [open, setOpen] = useState(0);
  const [pending, setPending] = useState<"draft" | "complete" | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const risks = activeRiskLabels(payload);
  const pdfHref = `/admin/agendamentos/${appointmentId}/anamnese/pdf`;

  function patch(partial: Partial<AnamnesisPayload>) {
    setPayload((current) => ({ ...current, ...partial }));
  }

  function patchClient(partial: Partial<AnamnesisPayload["client"]>) {
    setPayload((current) => ({ ...current, client: { ...current.client, ...partial } }));
  }

  function setHealth(key: HealthKey, partial: Partial<HealthFlag>) {
    setPayload((current) => ({
      ...current,
      health: { ...current.health, [key]: { ...current.health[key], ...partial } },
    }));
  }

  async function persist(mode: "draft" | "complete") {
    setPending(mode);
    setError(null);
    setMessage(null);
    const result = await saveAnamnesisAction({ appointmentId, mode, payload });
    if (!result.ok) {
      setPending(null);
      setError(result.message);
      return false;
    }
    if (mode === "complete") {
      router.push("/admin?anamnese=concluida");
      return true;
    }
    setPending(null);
    setStatus(result.status);
    setMessage("Rascunho salvo. Dá para retomar depois.");
    return true;
  }

  async function saveAndContinue() {
    const sectionError = continueSectionError(open, payload);
    if (sectionError) {
      setError(sectionError);
      return;
    }
    const saved = await persist("draft");
    if (saved) setOpen((current) => Math.min(current + 1, SECTIONS.length - 1));
  }

  function toggleProcedure(value: ProcedureValue) {
    setPayload((current) => {
      const selected = current.procedures.includes(value)
        ? current.procedures.filter((item) => item !== value)
        : [...current.procedures, value];
      return { ...current, procedures: selected };
    });
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
          {status === "completed" ? "Anamnese concluída" : status === "draft" ? "Rascunho" : "Nova anamnese"}
        </p>
        <h1 className="text-2xl font-semibold text-ink">{payload.client.name || "Anamnese"}</h1>
        <p className="text-sm text-ink/60">
          {serviceName} · {whenLabel}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-wine/40 bg-rose/15 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-2xl border border-surface bg-background px-4 py-3 text-sm text-ink">{message}</p>
      )}

      {SECTIONS.map((title, index) => (
        <section key={title} className="rounded-2xl border border-surface bg-background shadow-sm">
          <button
            type="button"
            onClick={() => setOpen(index)}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
          >
            <span className="font-semibold text-ink">{title}</span>
            <ChevronDown className={`h-5 w-5 text-wine transition ${open === index ? "rotate-180" : ""}`} />
          </button>
          {open === index && (
            <div className="flex flex-col gap-4 px-4 pb-4">
              {index === 0 && (
                <>
                  <Field label="Nome" value={payload.client.name} onChange={(name) => patchClient({ name })} />
                  <Field
                    label="Data de nascimento"
                    type="date"
                    value={payload.client.birthDate}
                    onChange={(birthDate) => patchClient({ birthDate })}
                  />
                  <Field label="RG" value={payload.client.rg} onChange={(rg) => patchClient({ rg })} />
                  <Field
                    label="CPF"
                    value={payload.client.cpf}
                    onChange={(cpf) => patchClient({ cpf: maskCpf(cpf) })}
                  />
                  <Field label="Endereço" value={payload.client.address} onChange={(address) => patchClient({ address })} />
                  <Field label="Cidade" value={payload.client.city} onChange={(city) => patchClient({ city })} />
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink/80">UF</span>
                    <select
                      value={payload.client.state}
                      onChange={(event) => patchClient({ state: event.target.value })}
                      className={fieldClass}
                    >
                      <option value="">Selecione</option>
                      {BRAZIL_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Telefone/WhatsApp"
                    value={payload.client.phone}
                    onChange={(phone) => patchClient({ phone: maskWhatsapp(phone) })}
                  />
                </>
              )}

              {index === 1 && (
                <>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-sm font-medium text-ink/80">Como conheceu o trabalho</legend>
                    {REFERRAL_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-3 text-sm text-ink">
                        <input
                          type="radio"
                          name="referral"
                          checked={payload.referral === option.value}
                          onChange={() => patch({ referral: option.value as ReferralValue })}
                          className="h-5 w-5 accent-wine"
                        />
                        {option.label}
                      </label>
                    ))}
                    {payload.referral === "outros" && (
                      <input
                        value={payload.referralOther}
                        onChange={(event) => patch({ referralOther: event.target.value })}
                        placeholder="Conte como conheceu"
                        className={fieldClass}
                      />
                    )}
                  </fieldset>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-sm font-medium text-ink/80">Tipo de procedimento</legend>
                    {PROCEDURE_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-3 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={payload.procedures.includes(option.value)}
                          onChange={() => toggleProcedure(option.value)}
                          className="h-5 w-5 accent-wine"
                        />
                        {option.label}
                      </label>
                    ))}
                    {payload.procedures.includes("outro") && (
                      <input
                        value={payload.procedureOther}
                        onChange={(event) => patch({ procedureOther: event.target.value })}
                        placeholder="Qual procedimento?"
                        className={fieldClass}
                      />
                    )}
                  </fieldset>
                </>
              )}

              {index === 2 && (
                <>
                  <Field
                    label="Marca do pigmento"
                    value={payload.pigment.brand}
                    onChange={(brand) => patch({ pigment: { ...payload.pigment, brand } })}
                  />
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink/80">Cores</span>
                    {payload.pigment.colors.map((color, colorIndex) => (
                      <div key={colorIndex} className="flex gap-2">
                        <input
                          value={color}
                          onChange={(event) => {
                            const colors = [...payload.pigment.colors];
                            colors[colorIndex] = event.target.value;
                            patch({ pigment: { ...payload.pigment, colors } });
                          }}
                          placeholder="Cor"
                          className={fieldClass}
                        />
                        {payload.pigment.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                pigment: {
                                  ...payload.pigment,
                                  colors: payload.pigment.colors.filter((_, item) => item !== colorIndex),
                                },
                              })
                            }
                            className="shrink-0 rounded-xl px-3 text-sm font-medium text-wine"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => patch({ pigment: { ...payload.pigment, colors: [...payload.pigment.colors, ""] } })}
                      className="self-start text-sm font-medium text-wine"
                    >
                      Adicionar cor
                    </button>
                  </div>
                  <Field
                    label="Tipo da agulha"
                    value={payload.needle.type}
                    onChange={(type) => patch({ needle: { ...payload.needle, type } })}
                  />
                  <Field
                    label="Velocidade"
                    value={payload.needle.speed}
                    onChange={(speed) => patch({ needle: { ...payload.needle, speed } })}
                  />
                </>
              )}

              {index === 3 && (
                <>
                  <RiskAlert labels={risks} />
                  {HEALTH_ITEMS.map((item) => (
                    <CheckRow
                      key={item.key}
                      label={item.label}
                      checked={payload.health[item.key].checked}
                      note={payload.health[item.key].note}
                      onChecked={(checked) => setHealth(item.key, { checked })}
                      onNote={(note) => setHealth(item.key, { note })}
                    />
                  ))}
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink/80">Uso de medicamentos</span>
                    <textarea
                      value={payload.medications}
                      onChange={(event) => patch({ medications: event.target.value })}
                      rows={3}
                      className={fieldClass}
                    />
                  </label>
                  <CheckRow
                    label="Lactação"
                    checked={payload.lactation.checked}
                    note={payload.lactation.note}
                    onChecked={(checked) => patch({ lactation: { ...payload.lactation, checked } })}
                    onNote={(note) => patch({ lactation: { ...payload.lactation, note } })}
                  />
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink/80">Outras condições</span>
                    <textarea
                      value={payload.otherConditions}
                      onChange={(event) => patch({ otherConditions: event.target.value })}
                      rows={3}
                      className={fieldClass}
                    />
                  </label>
                </>
              )}

              {index === 4 && (
                <ul className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
                  {ORIENTATIONS.map((item) => (
                    <li key={item} className="rounded-xl bg-surface/40 px-3 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {index === 5 && (
                <>
                  <p className="text-sm font-medium text-ink/80">Termo de autorização e responsabilidade</p>
                  {AUTHORIZATION_ITEMS.map((item) => (
                    <CheckRow
                      key={item.key}
                      label={item.label}
                      checked={payload.authorization[item.key]}
                      onChecked={(checked) =>
                        patch({ authorization: { ...payload.authorization, [item.key]: checked } as Record<AuthorizationKey, boolean> })
                      }
                    />
                  ))}
                  <p className="text-sm font-medium text-ink/80">Termo de consentimento</p>
                  {CONSENT_ITEMS.map((item) => (
                    <CheckRow
                      key={item.key}
                      label={item.label}
                      checked={payload.consent[item.key]}
                      onChecked={(checked) =>
                        patch({ consent: { ...payload.consent, [item.key]: checked } as Record<ConsentKey, boolean> })
                      }
                    />
                  ))}
                  <CheckRow
                    label={FINAL_DECLARATION}
                    checked={payload.finalDeclaration}
                    onChecked={(finalDeclaration) => patch({ finalDeclaration })}
                  />
                </>
              )}

              {index === 6 && (
                <>
                  <RiskAlert labels={risks} />
                  <fieldset className="flex flex-col gap-2">
                    <legend className="text-sm font-medium text-ink/80">Cliente apta a realizar o procedimento</legend>
                    <label className="flex items-center gap-3 text-sm text-ink">
                      <input
                        type="radio"
                        name="fit"
                        checked={payload.fitForProcedure === "yes"}
                        onChange={() => patch({ fitForProcedure: "yes" })}
                        className="h-5 w-5 accent-wine"
                      />
                      Sim
                    </label>
                    <label className="flex items-center gap-3 text-sm text-ink">
                      <input
                        type="radio"
                        name="fit"
                        checked={payload.fitForProcedure === "no"}
                        onChange={() => patch({ fitForProcedure: "no" })}
                        className="h-5 w-5 accent-wine"
                      />
                      Não
                    </label>
                  </fieldset>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink/80">Observações da aptidão</span>
                    <textarea
                      value={payload.fitNotes}
                      onChange={(event) => patch({ fitNotes: event.target.value })}
                      rows={3}
                      className={fieldClass}
                    />
                  </label>
                  <p className="text-sm text-ink/70">Data da assinatura: {formatDateKey(payload.signedAt || todayDateKey())}</p>
                  <SignaturePad
                    label="Assinatura da cliente"
                    value={payload.clientSignature}
                    onChange={(clientSignature) => patch({ clientSignature })}
                  />
                  <SignaturePad
                    label="Assinatura da profissional"
                    value={payload.professionalSignature}
                    onChange={(professionalSignature) => patch({ professionalSignature })}
                  />
                </>
              )}

              <button
                type="button"
                onClick={saveAndContinue}
                disabled={pending !== null}
                className="rounded-full bg-wine px-4 py-3 text-sm font-medium text-background hover:bg-ink disabled:opacity-60"
              >
                {pending === "draft" ? "Salvando..." : "Salvar e continuar"}
              </button>
            </div>
          )}
        </section>
      ))}

      <div className="sticky bottom-0 z-20 -mx-1 border-t border-surface bg-background/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => persist("draft")}
            disabled={pending !== null}
            className="rounded-full border border-wine px-4 py-3 text-sm font-medium text-wine disabled:opacity-60"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => persist("complete")}
            disabled={pending !== null}
            className="rounded-full bg-ink px-4 py-3 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending === "complete" ? "Salvando..." : "Concluir anamnese"}
          </button>
          {status && (
            <a href={pdfHref} className="rounded-full border border-surface px-4 py-3 text-sm font-medium text-ink">
              Baixar PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
