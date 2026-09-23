"use client";

import { useState } from "react";
import { centsToBrlInput, maskBrlFromDigits, maskSlug, maskWhatsapp, parseBrlToCents } from "@/lib/masks";

const inputClass =
  "rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20";

export function WhatsappField({
  id,
  name,
  label,
  defaultValue = "",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(maskWhatsapp(defaultValue));
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <input
        id={id}
        name={name}
        inputMode="tel"
        autoComplete="tel"
        required={required}
        placeholder="(65) 90000-0000"
        value={value}
        onChange={(event) => setValue(maskWhatsapp(event.target.value))}
        className={inputClass}
      />
    </label>
  );
}

export function MoneyField({
  id,
  name,
  label,
  defaultCents = 0,
  required = false,
  maxCents,
}: {
  id: string;
  name: string;
  label: string;
  defaultCents?: number;
  required?: boolean;
  maxCents?: number;
}) {
  const initial = maxCents != null ? Math.min(defaultCents, maxCents) : defaultCents;
  const [cents, setCents] = useState(initial);
  const [text, setText] = useState(centsToBrlInput(initial));

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <input
        id={id}
        inputMode="numeric"
        required={required}
        placeholder="0,00"
        value={text}
        onChange={(event) => {
          const masked = maskBrlFromDigits(event.target.value);
          const parsed = parseBrlToCents(masked) ?? 0;
          const next = maxCents != null ? Math.min(parsed, maxCents) : parsed;
          setCents(next);
          setText(centsToBrlInput(next));
        }}
        className={inputClass}
      />
      <input type="hidden" name={name} value={cents} />
    </label>
  );
}

export function SlugField({
  id,
  defaultValue = "",
}: {
  id: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">Slug</span>
      <input
        id={id}
        name="slug"
        required
        value={value}
        placeholder="nano-fios"
        onChange={(event) => setValue(maskSlug(event.target.value))}
        className={inputClass}
      />
    </label>
  );
}
