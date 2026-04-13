import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { exportRequestSchema } from "@/lib/validations/clubos-operations";
import PDFDocument from "pdfkit";

/**
 * POST /api/clubos/exports — Export data as CSV or PDF
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...exportData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.OPS_EXPORT_DATA);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const parsed = exportRequestSchema.safeParse(exportData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const admin = createUntypedAdminClient();
    const { format, resource, event_id, date_from, date_to } = parsed.data;

    // Fetch data based on resource type
    const { rows, columns, title } = await fetchExportData(
      admin, club_id, resource, { event_id, date_from, date_to }
    );

    // Log the export (best effort — table resolves after type regeneration)
    await admin.from("club_member_activity_events").insert({
      membership_id: role.membership?.id ?? null,
      club_id,
      event_type: "data_exported",
      metadata: { resource, format, row_count: rows.length, exported_by: auth.user.id },
    }).then(() => null, () => null);

    if (format === "csv") {
      return streamCsv(columns, rows, `${resource}-export`);
    }

    return streamPdf(columns, rows, title);
  } catch (err) {
    console.error("[clubos/exports] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── Data Fetching ────────────────────────────────────────────────

interface ExportFilters {
  event_id?: string;
  date_from?: string;
  date_to?: string;
}

async function fetchExportData(
  admin: ReturnType<typeof createUntypedAdminClient>,
  clubId: string,
  resource: string,
  filters: ExportFilters
): Promise<{ rows: Record<string, unknown>[]; columns: string[]; title: string }> {
  switch (resource) {
    case "events": {
      let query = admin
        .from("club_events")
        .select("title, type, status, starts_at, ends_at, location, registered_count, waitlist_count, attended_count")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false });

      if (filters.date_from) query = query.gte("starts_at", filters.date_from);
      if (filters.date_to) query = query.lte("starts_at", filters.date_to);

      const { data } = await query;
      return {
        rows: data ?? [],
        columns: ["title", "type", "status", "starts_at", "ends_at", "location", "registered_count", "waitlist_count", "attended_count"],
        title: "Club Events Export",
      };
    }

    case "registrations": {
      if (!filters.event_id) {
        return { rows: [], columns: [], title: "Registrations Export" };
      }

      const { data } = await admin
        .from("club_event_registrations")
        .select(`
          status, guest_count, registered_at, checked_in_at, notes,
          membership:club_memberships(profile:profiles(full_name, email))
        `)
        .eq("event_id", filters.event_id)
        .order("registered_at", { ascending: true });

      const rows = (data ?? []).map((r) => {
        const membership = r.membership as unknown as { profile: { full_name: string; email: string } } | null;
        return {
          name: membership?.profile?.full_name ?? "Unknown",
          email: membership?.profile?.email ?? "",
          status: r.status,
          guest_count: r.guest_count,
          registered_at: r.registered_at,
          checked_in_at: r.checked_in_at ?? "",
          notes: r.notes ?? "",
        };
      });

      return {
        rows,
        columns: ["name", "email", "status", "guest_count", "registered_at", "checked_in_at", "notes"],
        title: "Event Registrations Export",
      };
    }

    case "incidents": {
      let query = admin
        .from("club_incidents")
        .select("title, type, severity, status, description, resolution, occurred_at, created_at, resolved_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (filters.date_from) query = query.gte("created_at", filters.date_from);
      if (filters.date_to) query = query.lte("created_at", filters.date_to);

      const { data } = await query;
      return {
        rows: data ?? [],
        columns: ["title", "type", "severity", "status", "description", "resolution", "occurred_at", "created_at", "resolved_at"],
        title: "Incidents Export",
      };
    }

    case "waivers": {
      const { data } = await admin
        .from("club_waiver_signatures")
        .select(`
          signed_at, expires_at,
          waiver:club_waivers!inner(title, club_id),
          membership:club_memberships(profile:profiles(full_name, email))
        `)
        .eq("waiver.club_id", clubId)
        .order("signed_at", { ascending: false });

      const rows = (data ?? []).map((s) => {
        const waiver = s.waiver as unknown as { title: string } | null;
        const membership = s.membership as unknown as { profile: { full_name: string; email: string } } | null;
        return {
          waiver_title: waiver?.title ?? "",
          member_name: membership?.profile?.full_name ?? "Unknown",
          member_email: membership?.profile?.email ?? "",
          signed_at: s.signed_at,
          expires_at: s.expires_at ?? "Never",
        };
      });

      return {
        rows,
        columns: ["waiver_title", "member_name", "member_email", "signed_at", "expires_at"],
        title: "Waiver Signatures Export",
      };
    }

    case "activity": {
      let query = admin
        .from("club_member_activity_events")
        .select(`
          event_type, metadata, occurred_at,
          membership:club_memberships(profile:profiles(full_name, email))
        `)
        .eq("club_id", clubId)
        .order("occurred_at", { ascending: false })
        .limit(5000);

      if (filters.date_from) query = query.gte("occurred_at", filters.date_from);
      if (filters.date_to) query = query.lte("occurred_at", filters.date_to);

      const { data } = await query;
      const rows = (data ?? []).map((e) => {
        const membership = e.membership as unknown as { profile: { full_name: string; email: string } } | null;
        return {
          member_name: membership?.profile?.full_name ?? "Unknown",
          member_email: membership?.profile?.email ?? "",
          event_type: e.event_type,
          metadata: JSON.stringify(e.metadata ?? {}),
          occurred_at: e.occurred_at,
        };
      });

      return {
        rows,
        columns: ["member_name", "member_email", "event_type", "metadata", "occurred_at"],
        title: "Member Activity Export",
      };
    }

    default:
      return { rows: [], columns: [], title: "Export" };
  }
}

// ─── CSV Streaming ────────────────────────────────────────────────

function streamCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  filename: string
): Response {
  const escapeCsv = (val: unknown): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map(escapeCsv).join(",");
  const body = rows
    .map((row) => columns.map((col) => escapeCsv(row[col])).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

// ─── PDF Streaming ────────────────────────────────────────────────

function streamPdf(
  columns: string[],
  rows: Record<string, unknown>[],
  title: string
): Response {
  const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Title
  doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica").text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${rows.length} rows`,
    { align: "center" }
  );
  doc.moveDown(1);

  // Table
  const pageWidth = doc.page.width - 80;
  const colWidth = Math.min(pageWidth / columns.length, 150);
  const startX = 40;

  // Header row
  doc.font("Helvetica-Bold").fontSize(7);
  columns.forEach((col, i) => {
    const label = col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    doc.text(label, startX + i * colWidth, doc.y, {
      width: colWidth - 4,
      continued: i < columns.length - 1,
      lineBreak: false,
    });
  });
  doc.moveDown(0.3);

  // Draw header line
  doc
    .moveTo(startX, doc.y)
    .lineTo(startX + columns.length * colWidth, doc.y)
    .stroke();
  doc.moveDown(0.3);

  // Data rows
  doc.font("Helvetica").fontSize(6);
  for (const row of rows) {
    if (doc.y > doc.page.height - 60) {
      doc.addPage();
      doc.y = 40;
    }

    const rowY = doc.y;
    columns.forEach((col, i) => {
      const val = String(row[col] ?? "").substring(0, 60);
      doc.text(val, startX + i * colWidth, rowY, {
        width: colWidth - 4,
        lineBreak: false,
      });
    });
    doc.moveDown(0.4);
  }

  doc.end();

  return new Promise<Response>((resolve) => {
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new Response(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="export.pdf"`,
          },
        })
      );
    });
  }) as unknown as Response;
}
