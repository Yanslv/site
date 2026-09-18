"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { upsertBusinessHourRule, createBlockedPeriod, deleteBlockedPeriod } from "@/server/schedule";
import { setAutoConfirmAppointments } from "@/lib/settings";
import { parseDateKey, zonedTimeToUtc } from "@/lib/timezone";

function errorRedirect(message: string): never {
  redirect(`/admin/configuracoes?erro=${encodeURIComponent(message)}`);
}

function timeStringToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export async function updateBusinessHoursAction(formData: FormData): Promise<void> {
  await requireUser();

  for (let weekday = 0; weekday <= 6; weekday++) {
    const isClosed = formData.get(`closed-${weekday}`) === "on";
    const openValue = formData.get(`open-${weekday}`) as string | null;
    const closeValue = formData.get(`close-${weekday}`) as string | null;

    await upsertBusinessHourRule({
      weekday,
      isClosed,
      openMinute: !isClosed && openValue ? timeStringToMinutes(openValue) : null,
      closeMinute: !isClosed && closeValue ? timeStringToMinutes(closeValue) : null,
    });
  }

  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes");
}

export async function createBlockedPeriodAction(formData: FormData): Promise<void> {
  await requireUser();

  const dateKeyValue = formData.get("dateKey") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const reason = formData.get("reason") as string;

  if (!dateKeyValue || !startTime || !endTime) {
    errorRedirect("Preencha data, início e fim do bloqueio.");
  }

  const { year, month, day } = parseDateKey(dateKeyValue);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startAt = zonedTimeToUtc({ year, month, day, hour: startHour, minute: startMinute });
  const endAt = zonedTimeToUtc({ year, month, day, hour: endHour, minute: endMinute });

  if (endAt <= startAt) {
    errorRedirect("O fim do bloqueio deve ser depois do início.");
  }

  await createBlockedPeriod({ startAt, endAt, reason });
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes");
}

export async function deleteBlockedPeriodAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id") as string;
  await deleteBlockedPeriod(id);
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes");
}

export async function updateAutoConfirmAction(formData: FormData): Promise<void> {
  await requireUser();
  await setAutoConfirmAppointments(formData.get("autoConfirm") === "on");
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes");
}
