/**
 * Canonical water type constants.
 *
 * WATER_TYPES and COMMON_SPECIES are re-exported from the Zod validation
 * module so that runtime validators and UI code share a single source of truth.
 */

export { WATER_TYPES, COMMON_SPECIES } from "@/lib/validations/properties";

export const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

/** Water type options formatted for Select / filter components. */
export const WATER_TYPE_OPTIONS = Object.entries(WATER_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
