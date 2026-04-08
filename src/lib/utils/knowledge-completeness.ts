import {
  SECTION_FIELD_COUNTS,
  TOTAL_KNOWLEDGE_FIELDS,
  type KnowledgeSectionKey,
} from "@/lib/constants/property-knowledge";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

/**
 * Check if a value counts as "filled" for completeness scoring.
 */
function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    // For Record<string, boolean> (amenities-style), check if any are true
    const entries = Object.values(value);
    return entries.some((v) => v === true);
  }
  return false;
}

/**
 * Count filled fields in a flat object (one level deep).
 */
function countFilledFields(obj: Record<string, unknown> | null | undefined, fieldKeys: string[]): number {
  if (!obj) return 0;
  return fieldKeys.filter((key) => isFilled(obj[key])).length;
}

/**
 * Calculate completeness for a single section.
 * Returns { filled, total } counts.
 */
export function sectionCompleteness(
  sectionKey: KnowledgeSectionKey,
  data: PropertyKnowledgeFormData
): { filled: number; total: number } {
  const total = SECTION_FIELD_COUNTS[sectionKey];
  const section = data[sectionKey];

  if (!section) return { filled: 0, total };

  let filled = 0;

  switch (sectionKey) {
    case "water_characteristics": {
      const wc = section as NonNullable<PropertyKnowledgeFormData["water_characteristics"]>;
      const directFields = ["clarity", "wadeability", "depth_zones", "structural_features", "bottom_composition"];
      filled += countFilledFields(wc as Record<string, unknown>, directFields);
      // Count each season temp profile that has at least one value
      for (const season of ["temp_spring", "temp_summer", "temp_fall", "temp_winter"] as const) {
        const tp = wc[season];
        if (tp && (isFilled(tp.min_f) || isFilled(tp.max_f) || isFilled(tp.optimal_f))) {
          filled++;
        }
      }
      // Stream width counts as 1 if either min or max is filled
      if (isFilled(wc.stream_width_ft_min) || isFilled(wc.stream_width_ft_max)) {
        // not counted separately — included in the 8
      }
      break;
    }

    case "species_detail": {
      const entries = section as PropertyKnowledgeFormData["species_detail"];
      if (Array.isArray(entries) && entries.length > 0) {
        // Check if at least one entry has 3+ filled fields beyond species_name
        const hasDetailedEntry = entries.some((entry) => {
          const detailFields = [
            "abundance", "avg_size_min_inches", "avg_size_max_inches",
            "trophy_size_inches", "population_source", "feeding_patterns", "best_technique",
          ];
          return countFilledFields(entry as Record<string, unknown>, detailFields) >= 3;
        });
        filled = hasDetailedEntry ? 1 : 0;
      }
      break;
    }

    case "hatches_and_patterns": {
      const entries = section as PropertyKnowledgeFormData["hatches_and_patterns"];
      if (Array.isArray(entries) && entries.length > 0) {
        const hasDetailedEntry = entries.some((entry) => {
          const detailFields = [
            "insect_type", "peak_months", "time_of_day",
            "matching_patterns", "fly_categories", "hook_sizes",
          ];
          return countFilledFields(entry as Record<string, unknown>, detailFields) >= 3;
        });
        filled = hasDetailedEntry ? 1 : 0;
      }
      break;
    }

    case "seasonal_conditions": {
      const sc = section as NonNullable<PropertyKnowledgeFormData["seasonal_conditions"]>;
      if (isFilled(sc.best_months)) filled++;
      if (isFilled(sc.runoff_timing)) filled++;
      for (const season of ["spring", "summer", "fall", "winter"] as const) {
        const sp = sc[season];
        if (sp) {
          const seasonFields = ["water_temp_range", "clarity", "fish_activity", "best_techniques"];
          if (countFilledFields(sp as Record<string, unknown>, seasonFields) >= 2) {
            filled++;
          }
        }
      }
      break;
    }

    case "flow_and_gauge": {
      const fg = section as NonNullable<PropertyKnowledgeFormData["flow_and_gauge"]>;
      const fields = ["usgs_gauge_id", "gauge_url", "optimal_wade_cfs_min", "optimal_wade_cfs_max", "stress_temp_f"];
      filled = countFilledFields(fg as Record<string, unknown>, fields);
      break;
    }

    case "access_and_logistics": {
      const al = section as NonNullable<PropertyKnowledgeFormData["access_and_logistics"]>;
      const fields = [
        "elevation_ft", "nearest_town", "parking_spaces", "parking_surface",
        "vehicle_clearance", "walk_distance_to_water_ft", "cell_coverage",
        "access_method", "boat_launch_type", "float_difficulty",
      ];
      filled = countFilledFields(al as Record<string, unknown>, fields);
      break;
    }

    case "regulations_and_rules": {
      const rr = section as NonNullable<PropertyKnowledgeFormData["regulations_and_rules"]>;
      const fields = ["catch_release", "hook_rules", "method_restriction", "creel_limit", "club_specific_rules"];
      filled = countFilledFields(rr as Record<string, unknown>, fields);
      break;
    }

    case "equipment_recommendations": {
      const er = section as NonNullable<PropertyKnowledgeFormData["equipment_recommendations"]>;
      const fields = [
        "rod_weight_primary", "rod_weight_secondary", "wader_type",
        "boot_type", "essential_fly_categories", "fly_size_range", "tippet_range",
      ];
      filled = countFilledFields(er as Record<string, unknown>, fields);
      break;
    }

    case "safety_and_hazards": {
      const sh = section as NonNullable<PropertyKnowledgeFormData["safety_and_hazards"]>;
      const fields = ["wildlife_hazards", "water_hazards", "terrain_difficulty", "remote_rating", "nearest_hospital"];
      filled = countFilledFields(sh as Record<string, unknown>, fields);
      break;
    }

    case "amenities": {
      const am = section as NonNullable<PropertyKnowledgeFormData["amenities"]>;
      const fields = ["site_amenities", "restroom_type", "nearby_services"];
      filled = countFilledFields(am as Record<string, unknown>, fields);
      break;
    }

    case "experience_profile": {
      const ep = section as NonNullable<PropertyKnowledgeFormData["experience_profile"]>;
      const fields = [
        "solitude_rating", "scenery_rating", "beginner_friendly_rating",
        "best_for", "property_story", "unique_features",
      ];
      filled = countFilledFields(ep as Record<string, unknown>, fields);
      break;
    }

    case "pressure_and_crowding": {
      const pc = section as NonNullable<PropertyKnowledgeFormData["pressure_and_crowding"]>;
      const fields = ["overall_pressure", "weekday_pressure", "weekend_pressure"];
      filled = countFilledFields(pc as Record<string, unknown>, fields);
      break;
    }
  }

  return { filled: Math.min(filled, total), total };
}

/**
 * Calculate overall completeness score (0-100) across all sections.
 */
export function calculateCompleteness(data: PropertyKnowledgeFormData): number {
  let totalFilled = 0;

  for (const section of Object.keys(SECTION_FIELD_COUNTS) as KnowledgeSectionKey[]) {
    const { filled } = sectionCompleteness(section, data);
    totalFilled += filled;
  }

  return Math.round((totalFilled / TOTAL_KNOWLEDGE_FIELDS) * 100);
}

/**
 * Get a human-friendly message based on completeness score.
 */
export function completenessMessage(score: number): {
  tier: "starting" | "basic" | "rich" | "excellent";
  message: string;
} {
  if (score <= 25) {
    return {
      tier: "starting",
      message: "Getting started — fill out more to increase your property's visibility in Compass AI recommendations.",
    };
  }
  if (score <= 50) {
    return {
      tier: "basic",
      message: "Good progress! Compass AI can now provide basic recommendations for your property.",
    };
  }
  if (score <= 75) {
    return {
      tier: "rich",
      message: "Great detail! Compass AI can give rich, specific advice about your property to anglers.",
    };
  }
  return {
    tier: "excellent",
    message: "Excellent! Your property has one of the most detailed profiles on the platform.",
  };
}
