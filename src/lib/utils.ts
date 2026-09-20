import { clsx, type ClassValue } from "clsx";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isPast,
  isToday,
} from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Suggest a short uppercase project key from a name. */
export function suggestKey(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let key: string;
  if (words.length >= 2) {
    key = words
      .slice(0, 3)
      .map((w) => w[0])
      .join("");
  } else {
    key = (words[0] ?? "PRJ").replace(/[^a-zA-Z]/g, "").slice(0, 3);
  }
  return (key || "PRJ").toUpperCase();
}

export function formatDate(date: Date | string | null | undefined, fmt = "MMM d") {
  if (!date) return null;
  return format(typeof date === "string" ? new Date(date) : date, fmt);
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(typeof date === "string" ? new Date(date) : date, {
    addSuffix: true,
  });
}

export type DueTone = "overdue" | "today" | "soon" | "later" | null;

export function dueTone(due: Date | string | null | undefined): DueTone {
  if (!due) return null;
  const d = typeof due === "string" ? new Date(due) : due;
  if (isToday(d)) return "today";
  if (isPast(d)) return "overdue";
  const days = differenceInCalendarDays(d, new Date());
  if (days <= 3) return "soon";
  return "later";
}

export const DUE_TONE_CLASSES: Record<Exclude<DueTone, null>, string> = {
  overdue: "text-rose-400",
  today: "text-brand-400",
  soon: "text-brand-300",
  later: "text-ink-400",
};
