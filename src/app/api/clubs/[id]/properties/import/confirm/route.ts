import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import {
  parsePropertyCsv,
  type PropertyImportRow,
} from "@/lib/validations/property-import";
import { parseCoordinates } from "@/lib/geo";

/**
 * POST /api/clubs/[id]/properties/import/confirm
 * Step 2: Re-validate CSV and create properties as drafts.
 * Only valid rows are imported; invalid rows are skipped.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const role = await requireClubRole(auth.user.id, clubId, "club.manage_properties");
  if (!role?.allowed) return jsonError("Forbidden", 403);

  try {
    const body = await request.json();
    const csvText = body.csv;

    if (!csvText || typeof csvText !== "string") {
      return jsonError("CSV text is required", 400);
    }

    // Re-validate
    const { rows, headerErrors } = parsePropertyCsv(csvText);

    if (headerErrors.length > 0) {
      return jsonError(headerErrors.join("; "), 400);
    }

    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      return jsonError("No valid rows to import", 400);
    }

    const admin = createAdminClient();
    const created: string[] = [];
    const failed: { row: number; error: string }[] = [];

    for (const row of validRows) {
      try {
        const property = buildPropertyInsert(row.data, clubId);

        const { data, error } = await admin
          .from("properties")
          .insert(property)
          .select("id")
          .single();

        if (error) {
          failed.push({ row: row.row, error: error.message });
          continue;
        }

        // Auto-create club_property_access (approved)
        await admin.from("club_property_access").insert({
          club_id: clubId,
          property_id: data.id,
          requested_by: auth.user.id,
          status: "approved",
          approved_at: new Date().toISOString(),
        });

        created.push(data.id);
      } catch (err) {
        failed.push({
          row: row.row,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return jsonOk({
      imported: created.length,
      failed: failed.length,
      failures: failed,
      propertyIds: created,
    });
  } catch (err) {
    console.error("[import/confirm] Error:", err);
    return jsonError("Failed to import properties", 500);
  }
}

function buildPropertyInsert(data: PropertyImportRow, clubId: string) {
  const { latitude, longitude } = parseCoordinates(data.coordinates);

  const parseNum = (val: string | undefined): number | null => {
    if (!val) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  const parseInt_ = (val: string | undefined): number | null => {
    if (!val) return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  };

  return {
    name: data.name,
    description: data.description || null,
    location_description: data.location_description || null,
    coordinates: data.coordinates || null,
    latitude,
    longitude,
    water_type: data.water_type || null,
    species: data.species
      ? data.species
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    water_miles: parseNum(data.water_miles),
    max_rods: parseInt_(data.max_rods),
    max_guests: parseInt_(data.max_guests),
    regulations: data.regulations || null,
    rate_adult_full_day: parseNum(data.rate_adult_full_day),
    rate_youth_full_day: parseNum(data.rate_youth_full_day),
    rate_child_full_day: parseNum(data.rate_child_full_day),
    access_notes: data.access_notes || null,
    owner_id: null,
    created_by_club_id: clubId,
    status: "draft",
    photos: [],
  };
}
