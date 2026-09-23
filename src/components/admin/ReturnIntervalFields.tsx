"use client";

import { useState } from "react";

export default function ReturnIntervalFields({
  hasReturn,
  returnAmount,
  returnUnit,
}: {
  hasReturn: boolean;
  returnAmount: number | null;
  returnUnit: "days" | "months" | null;
}) {
  const [enabled, setEnabled] = useState(hasReturn);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface bg-surface/20 p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
        <input
          type="checkbox"
          name="hasReturn"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-surface text-wine focus:ring-wine/30"
        />
        Tem retorno?
      </label>
      {enabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="returnAmount" className="text-sm font-medium text-ink/80">
              Daqui a quanto tempo
            </label>
            <input
              id="returnAmount"
              name="returnAmount"
              type="number"
              min={1}
              max={365}
              required
              defaultValue={returnAmount ?? 30}
              className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="returnUnit" className="text-sm font-medium text-ink/80">
              Dias ou meses
            </label>
            <select
              id="returnUnit"
              name="returnUnit"
              required
              defaultValue={returnUnit ?? "days"}
              className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
            >
              <option value="days">Dias</option>
              <option value="months">Meses</option>
            </select>
          </div>
          <p className="text-xs leading-relaxed text-ink/60 sm:col-span-2">
            No agendamento, a cliente vê a data do retorno e esse horário já entra na agenda, no mesmo
            horário do procedimento. Se estiver ocupado, marcamos o próximo livre e avisamos. A Ioná pode
            remarcar depois.
          </p>
        </div>
      )}
    </div>
  );
}
