/**
 * CRM Lead Segment Engine — builds SQL queries against the leads table.
 *
 * Used alongside the main segment engine to include waitlist leads
 * in broadcast campaigns. Only evaluates lead-specific fields:
 *   - interest_type (landowner, club, angler, investor, other)
 *   - source (homepage, etc.)
 *   - type (waitlist, investor, contact)
 *   - created_at
 *
 * Profile-only conditions (role, booking_count, etc.) are ignored —
 * leads don't have profiles.
 */

import "server-only";

import type { SegmentRuleGroup, SegmentCondition, SegmentOperator } from "@/lib/crm/types";

export interface SqlFragment {
  sql: string;
  params: unknown[];
}

// ─── Lead Field Mapping ────────────────────────────────────────────

/** Maps segment fields to leads table columns. Returns null for unsupported fields. */
function leadColumn(field: string): string | null {
  switch (field) {
    case "lead.interest_type":
      return "l.interest_type";
    case "lead.source":
      return "l.source";
    case "lead.type":
      return "l.type";
    case "created_at":
      return "l.created_at";
    default:
      return null;
  }
}

const SQL_OPS: Record<SegmentOperator, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "= ANY",
  not_in: "!= ALL",
  contains: "ILIKE",
  not_contains: "NOT ILIKE",
  is_null: "IS NULL",
  not_null: "IS NOT NULL",
  between: "BETWEEN",
};

// ─── Condition → SQL (lead context) ────────────────────────────────

function buildLeadConditionSql(
  condition: SegmentCondition,
  paramStart: number
): SqlFragment | null {
  const col = leadColumn(condition.field);
  if (!col) return null; // Field not applicable to leads

  const { op, value } = condition;

  if (op === "is_null" || op === "not_null") {
    return { sql: `${col} ${SQL_OPS[op]}`, params: [] };
  }

  if (op === "in" || op === "not_in") {
    const arr = Array.isArray(value) ? value : [value];
    const sqlOp = op === "in" ? "= ANY" : "!= ALL";
    return {
      sql: `${col} ${sqlOp}($${paramStart}::text[])`,
      params: [arr],
    };
  }

  if (op === "between") {
    const [lo, hi] = Array.isArray(value) ? value : [value, value];
    return {
      sql: `${col} BETWEEN $${paramStart} AND $${paramStart + 1}`,
      params: [lo, hi],
    };
  }

  if (op === "contains" || op === "not_contains") {
    const likeVal = `%${String(value).replace(/%/g, "\\%")}%`;
    return {
      sql: `${col}::text ${SQL_OPS[op]} $${paramStart}`,
      params: [likeVal],
    };
  }

  return {
    sql: `${col} ${SQL_OPS[op]} $${paramStart}`,
    params: [value],
  };
}

// ─── Group → SQL ───────────────────────────────────────────────────

function buildLeadGroupSql(
  group: SegmentRuleGroup,
  paramStart: number
): SqlFragment | null {
  const joiner = group.match === "all" ? " AND " : " OR ";
  const fragments: string[] = [];
  const allParams: unknown[] = [];
  let paramIndex = paramStart;

  for (const condition of group.conditions) {
    const frag = buildLeadConditionSql(condition, paramIndex);
    if (!frag) continue; // Skip non-lead fields
    fragments.push(frag.sql);
    allParams.push(...frag.params);
    paramIndex += frag.params.length;
  }

  if (fragments.length === 0) return null;

  return {
    sql: `(${fragments.join(joiner)})`,
    params: allParams,
  };
}

// ─── Full Leads Query Builder ──────────────────────────────────────

/**
 * Check if segment rules contain any lead-applicable conditions.
 */
export function hasLeadConditions(rules: SegmentRuleGroup[]): boolean {
  return rules.some((group) =>
    group.conditions.some((c) => leadColumn(c.field) !== null)
  );
}

/**
 * Build a SELECT query against the leads table for lead-applicable
 * segment conditions. Returns null if no conditions apply to leads.
 */
export function buildLeadSegmentQuery(
  rules: SegmentRuleGroup[],
  options: {
    select?: string;
    limit?: number;
    countOnly?: boolean;
  } = {}
): SqlFragment | null {
  const {
    select = "l.id, l.email, l.first_name, l.last_name, l.interest_type",
    limit,
    countOnly,
  } = options;

  if (!rules || rules.length === 0) return null;

  const groupFragments: string[] = [];
  const allParams: unknown[] = [];
  let paramIndex = 1;

  for (const group of rules) {
    const frag = buildLeadGroupSql(group, paramIndex);
    if (!frag) continue;
    groupFragments.push(frag.sql);
    allParams.push(...frag.params);
    paramIndex += frag.params.length;
  }

  if (groupFragments.length === 0) return null;

  const whereClause = groupFragments.join(" OR ");
  const selectClause = countOnly ? "COUNT(*) as count" : select;

  // Exclude leads that have already converted to users
  let sql = `SELECT ${selectClause} FROM leads l WHERE l.converted_to_user_id IS NULL AND (${whereClause})`;

  if (!countOnly && limit) {
    sql += ` LIMIT ${limit}`;
  }

  return { sql, params: allParams };
}
