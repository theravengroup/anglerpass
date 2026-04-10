/**
 * CRM Segment Evaluator — executes segment queries and returns results.
 *
 * Uses the segment engine to translate rules into SQL, then runs them
 * against the database via the Supabase admin client's `.rpc()` or
 * raw query mechanism.
 *
 * Because Supabase JS doesn't expose raw SQL execution, we use a
 * lightweight database function (evaluate_segment_query) to run
 * parameterized queries safely.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SegmentRuleGroup,
  SegmentPreview,
  CrmRecipient,
  Segment,
} from "@/lib/crm/types";
import { buildSegmentQuery } from "@/lib/crm/segment-engine";
import {
  buildLeadSegmentQuery,
  hasLeadConditions,
} from "@/lib/crm/lead-segment-engine";

// ─── Core Evaluator ─────────────────────────────────────────────────

/**
 * Count how many profiles match a set of segment rules.
 */
export async function countSegment(
  admin: SupabaseClient,
  rules: SegmentRuleGroup[]
): Promise<number> {
  const query = buildSegmentQuery(rules, { countOnly: true });

  const { data, error } = await admin.rpc("evaluate_segment_query", {
    query_sql: query.sql,
    query_params: JSON.stringify(query.params),
  });

  if (error) {
    console.error("[crm/segment-evaluator] Count error:", error);
    throw new Error(`Segment count failed: ${error.message}`);
  }

  // The RPC returns [{ count: N }]
  const rows = data as Record<string, unknown>[];
  if (rows && rows.length > 0 && "count" in rows[0]) {
    return Number(rows[0].count);
  }
  return 0;
}

/**
 * Preview a segment — returns count + sample of matching profiles.
 */
export async function previewSegment(
  admin: SupabaseClient,
  rules: SegmentRuleGroup[],
  sampleSize = 10
): Promise<SegmentPreview> {
  // Get count
  const count = await countSegment(admin, rules);

  // Get sample
  const sampleQuery = buildSegmentQuery(rules, {
    select: "p.id, p.email, p.display_name, p.role",
    limit: sampleSize,
  });

  const { data, error } = await admin.rpc("evaluate_segment_query", {
    query_sql: sampleQuery.sql,
    query_params: JSON.stringify(sampleQuery.params),
  });

  if (error) {
    console.error("[crm/segment-evaluator] Preview error:", error);
    return { count, sample: [] };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    email: string;
    display_name: string | null;
    role: string;
  }>;

  return {
    count,
    sample: rows.map((r) => ({
      id: r.id,
      email: r.email,
      display_name: r.display_name,
      role: r.role,
    })),
  };
}

/**
 * Get all matching recipients for a segment — used when sending campaigns.
 * Returns full CrmRecipient objects suitable for enrollment/sending.
 *
 * When `includeLeads` is true and the segment rules contain lead-applicable
 * conditions, also queries the leads table and returns mixed user+lead results.
 * Leads that have already converted to users are excluded to prevent duplicates.
 */
export async function getSegmentRecipients(
  admin: SupabaseClient,
  rules: SegmentRuleGroup[],
  options: { includeLeads?: boolean } = {}
): Promise<CrmRecipient[]> {
  const recipients: CrmRecipient[] = [];

  // 1. Always query profiles (users)
  const query = buildSegmentQuery(rules, {
    select: "p.id, p.email, p.display_name, p.role",
  });

  const { data, error } = await admin.rpc("evaluate_segment_query", {
    query_sql: query.sql,
    query_params: JSON.stringify(query.params),
  });

  if (error) {
    console.error("[crm/segment-evaluator] Recipients error:", error);
    throw new Error(`Segment query failed: ${error.message}`);
  }

  const userEmails = new Set<string>();

  for (const r of (data ?? []) as Array<{
    id: string;
    email: string;
    display_name: string | null;
  }>) {
    recipients.push({
      user_id: r.id,
      email: r.email,
      display_name: r.display_name,
      recipient_type: "user",
      lead_id: null,
    });
    userEmails.add(r.email.toLowerCase());
  }

  // 2. Query leads if requested and segment has lead-applicable conditions
  if (options.includeLeads && hasLeadConditions(rules)) {
    const leadQuery = buildLeadSegmentQuery(rules);

    if (leadQuery) {
      const { data: leadData, error: leadError } = await admin.rpc(
        "evaluate_segment_query",
        {
          query_sql: leadQuery.sql,
          query_params: JSON.stringify(leadQuery.params),
        }
      );

      if (leadError) {
        console.error("[crm/segment-evaluator] Lead recipients error:", leadError);
        // Don't throw — gracefully degrade to users-only
      } else {
        for (const r of (leadData ?? []) as Array<{
          id: string;
          email: string;
          first_name: string;
          last_name: string | null;
        }>) {
          // Skip leads whose email is already in the user list
          if (userEmails.has(r.email.toLowerCase())) continue;

          const displayName = r.last_name
            ? `${r.first_name} ${r.last_name}`
            : r.first_name;

          recipients.push({
            user_id: null,
            email: r.email,
            display_name: displayName,
            recipient_type: "lead",
            lead_id: r.id,
          });
        }
      }
    }
  }

  return recipients;
}

// ─── Segment CRUD Helpers ───────────────────────────────────────────

/**
 * Refresh the cached count for a segment.
 */
export async function refreshSegmentCache(
  admin: SupabaseClient,
  segmentId: string
): Promise<number> {
  const segments = admin.from("segments");

  const { data: segment } = await segments
    .select("id, rules")
    .eq("id", segmentId)
    .maybeSingle();

  if (!segment) {
    throw new Error(`Segment not found: ${segmentId}`);
  }

  const rules = (segment as Record<string, unknown>).rules as SegmentRuleGroup[];
  const count = await countSegment(admin, rules);

  await segments
    .update({
      cached_count: count,
      cached_at: new Date().toISOString(),
    })
    .eq("id", segmentId);

  return count;
}

/**
 * Check if a specific user matches a segment's rules.
 * Used by the trigger system to evaluate segment membership.
 */
export async function userMatchesSegment(
  admin: SupabaseClient,
  userId: string,
  segmentOrId: string | Segment
): Promise<boolean> {
  let rules: SegmentRuleGroup[];

  if (typeof segmentOrId === "string") {
    const { data: segment } = await admin.from("segments")
      .select("rules")
      .eq("id", segmentOrId)
      .maybeSingle();

    if (!segment) return false;
    rules = (segment as Record<string, unknown>).rules as SegmentRuleGroup[];
  } else {
    rules = segmentOrId.rules;
  }

  // Build the query with an extra condition: p.id = userId
  const query = buildSegmentQuery(rules, { countOnly: true });

  // Append the user ID filter
  const paramIndex = query.params.length + 1;
  const filteredSql = query.sql.replace(
    "WHERE",
    `WHERE p.id = $${paramIndex} AND`
  );

  const { data, error } = await admin.rpc("evaluate_segment_query", {
    query_sql: filteredSql,
    query_params: JSON.stringify([...query.params, userId]),
  });

  if (error) {
    console.error("[crm/segment-evaluator] Match check error:", error);
    return false;
  }

  const rows = data as Record<string, unknown>[];
  return rows && rows.length > 0 && Number(rows[0].count) > 0;
}
