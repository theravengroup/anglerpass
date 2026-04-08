import { RATING_LABELS } from "@/lib/constants/property-knowledge";

/**
 * Display a plain value, returning "Not provided" for null/undefined/empty.
 */
export function displayValue(val: unknown): string {
  if (val == null || val === "") return "Not provided";
  return String(val);
}

/**
 * Look up a select value in a labels Record, with fallback.
 */
export function displaySelect(
  val: unknown,
  labels: Record<string, string>
): string {
  if (val == null || val === "") return "Not provided";
  return labels[String(val)] ?? String(val);
}

/**
 * Map an array of values through a labels Record, joining with ", ".
 */
export function displayMultiSelect(
  arr: unknown,
  labels: Record<string, string>
): string {
  if (!Array.isArray(arr) || arr.length === 0) return "Not provided";
  return arr.map((v) => labels[String(v)] ?? String(v)).join(", ");
}

/**
 * Display a 1-5 rating with its descriptive label: "X/5 -- Label".
 */
export function displayRating(val: unknown, ratingKey: string): string {
  if (val == null || val === "") return "Not provided";
  const num = Number(val);
  const label = RATING_LABELS[ratingKey]?.[num];
  if (label) return `${num}/5 — ${label}`;
  return `${num}/5`;
}

/**
 * Display a boolean as "Yes" / "No" / "Not provided".
 */
export function displayBoolean(val: unknown): string {
  if (val == null) return "Not provided";
  return val ? "Yes" : "No";
}

/**
 * Check if a value is "empty" (null, undefined, empty string, or empty array).
 */
export function isEmpty(val: unknown): boolean {
  if (val == null || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}
