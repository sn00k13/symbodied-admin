import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function naira(n: number | string) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export function pct(raised: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

export function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
