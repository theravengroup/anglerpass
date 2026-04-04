import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { parsePropertyCsv } from "@/lib/validations/property-import";

/**
 * POST /api/clubs/[id]/properties/import
 * Step 1: Parse and validate CSV, return preview of rows.
 * Accepts raw CSV text in the request body as { csv: string }.
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

    if (csvText.length > 500_000) {
      return jsonError("CSV file too large (max 500KB)", 400);
    }

    const { rows, headerErrors } = parsePropertyCsv(csvText);

    if (headerErrors.length > 0) {
      return jsonError(headerErrors.join("; "), 400);
    }

    if (rows.length === 0) {
      return jsonError("No data rows found in CSV", 400);
    }

    if (rows.length > 100) {
      return jsonError("Maximum 100 properties per import", 400);
    }

    const validCount = rows.filter((r) => r.valid).length;
    const invalidCount = rows.filter((r) => !r.valid).length;

    return jsonOk({
      preview: rows,
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
    });
  } catch (err) {
    console.error("[import] Parse error:", err);
    return jsonError("Failed to parse CSV", 500);
  }
}
