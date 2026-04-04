import { z } from "zod";
import { WATER_TYPES } from "./properties";

/**
 * Schema for a single row in a CSV property import.
 * Text-only — no photo URLs. Properties are created as drafts.
 */
export const propertyImportRowSchema = z.object({
  name: z.string().min(1, "Property name is required").max(200),
  description: z.string().max(5000).optional().default(""),
  location_description: z.string().max(1000).optional().default(""),
  coordinates: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => {
        if (!val) return true;
        const match = val.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (!match) return false;
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      },
      { message: "Invalid coordinates (use: lat, lng)" }
    ),
  water_type: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => !val || (WATER_TYPES as readonly string[]).includes(val),
      { message: `Must be one of: ${WATER_TYPES.join(", ")}` }
    ),
  species: z.string().optional().default(""),
  water_miles: z.string().optional().default(""),
  max_rods: z.string().optional().default(""),
  max_guests: z.string().optional().default(""),
  regulations: z.string().max(5000).optional().default(""),
  rate_adult_full_day: z.string().optional().default(""),
  rate_youth_full_day: z.string().optional().default(""),
  rate_child_full_day: z.string().optional().default(""),
  access_notes: z.string().max(2000).optional().default(""),
});

export type PropertyImportRow = z.infer<typeof propertyImportRowSchema>;

export interface ParsedImportRow {
  row: number;
  data: PropertyImportRow;
  errors: string[];
  valid: boolean;
}

/**
 * Expected CSV columns in order. Column names are case-insensitive.
 */
export const CSV_COLUMNS = [
  "name",
  "description",
  "location_description",
  "coordinates",
  "water_type",
  "species",
  "water_miles",
  "max_rods",
  "max_guests",
  "regulations",
  "rate_adult_full_day",
  "rate_youth_full_day",
  "rate_child_full_day",
  "access_notes",
] as const;

/**
 * Parse a CSV string into an array of validated rows.
 */
export function parsePropertyCsv(csvText: string): {
  rows: ParsedImportRow[];
  headerErrors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], headerErrors: ["CSV file is empty"] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  // Validate required column: name
  const headerErrors: string[] = [];
  if (!headers.includes("name")) {
    headerErrors.push('Missing required column: "name"');
  }

  if (headerErrors.length > 0) {
    return { rows: [], headerErrors };
  }

  // Parse data rows
  const rows: ParsedImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowData: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      const col = headers[j];
      if (CSV_COLUMNS.includes(col as (typeof CSV_COLUMNS)[number])) {
        rowData[col] = values[j]?.trim() ?? "";
      }
    }

    const result = propertyImportRowSchema.safeParse(rowData);
    if (result.success) {
      rows.push({
        row: i + 1,
        data: result.data,
        errors: [],
        valid: true,
      });
    } else {
      rows.push({
        row: i + 1,
        data: rowData as unknown as PropertyImportRow,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        ),
        valid: false,
      });
    }
  }

  return { rows, headerErrors: [] };
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
