import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date as a YYYY-MM-DD string. */
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
