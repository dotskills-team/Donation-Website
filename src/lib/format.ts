import type { CollectionMethod } from "@/types";

export const METHOD_LABEL: Record<CollectionMethod, string> = {
  CASH: "Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank",
  OTHER: "Other",
};
export const METHODS = Object.keys(METHOD_LABEL) as CollectionMethod[];

export function money(n: number) {
  return `৳${(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso?: string | Date, withTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
