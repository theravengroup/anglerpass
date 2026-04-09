/**
 * CRM Segment Engine — translates JSONB segment rules into SQL queries.
 *
 * Segment rules are stored as SegmentRuleGroup[] (an array of groups).
 * Groups are combined with OR (any group matching = user matches).
 * Within a group, conditions are combined per the group's `match` field:
 *   - "all" → AND
 *   - "any" → OR
 *
 * Supported field families:
 *   - Profile fields (role, location, fishing_experience, etc.)
 *   - Club membership fields (club_membership.club_id, club_membership.status)
 *   - Booking aggregates (booking_count, last_booking_at, has_booking)
 *   - Lead fields (lead.interest_type, lead.source)
 *   - Engagement aggregates (engagement.last_opened_at, engagement.total_opens)
 *   - Account fields (created_at, welcome_email_step, suspended_at)
 */

import "server-only";

import type {
  SegmentCondition,
  SegmentOperator,
  SegmentRuleGroup,
} from "@/lib/crm/types";

// ─── Types ──────────────────────────────────────────────────────────

export interface SqlFragment {
  sql: string;
  params: unknown[];
}

// ─── Operator Mapping ───────────────────────────────────────────────

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

// ─── Field → SQL Column Mapping ─────────────────────────────────────

/**
 * Maps segment field identifiers to their SQL column expressions.
 * Some fields reference related tables and require subqueries or joins.
 */
type FieldCategory = "profile" | "subquery";

interface FieldMapping {
  category: FieldCategory;
  /** For profile fields: the column on the profiles table */
  column?: string;
  /** For subquery fields: a function that builds the subquery clause */
  buildSubquery?: (op: SegmentOperator, paramIndex: number) => SqlFragment;
}

function profileField(column: string): FieldMapping {
  return { category: "profile", column };
}

function subqueryField(
  builder: (op: SegmentOperator, paramIndex: number) => SqlFragment
): FieldMapping {
  return { category: "subquery", buildSubquery: builder };
}

const FIELD_MAP: Record<string, FieldMapping> = {
  role: profileField("role"),
  created_at: profileField("created_at"),
  location: profileField("location"),
  fishing_experience: profileField("fishing_experience"),
  favorite_species: profileField("favorite_species"),
  welcome_email_step: profileField("welcome_email_step"),
  suspended_at: profileField("suspended_at"),

  // Club membership — EXISTS subquery
  "club_membership.club_id": subqueryField((_op, _pi) => ({
    sql: `EXISTS (SELECT 1 FROM club_memberships cm WHERE cm.user_id = p.id AND cm.club_id`,
    params: [],
  })),
  "club_membership.status": subqueryField((_op, _pi) => ({
    sql: `EXISTS (SELECT 1 FROM club_memberships cm WHERE cm.user_id = p.id AND cm.status`,
    params: [],
  })),

  // Booking aggregates — subqueries against bookings
  booking_count: subqueryField((_op, _pi) => ({
    sql: `(SELECT COUNT(*) FROM bookings b WHERE b.angler_id = p.id)`,
    params: [],
  })),
  last_booking_at: subqueryField((_op, _pi) => ({
    sql: `(SELECT MAX(b.created_at) FROM bookings b WHERE b.angler_id = p.id)`,
    params: [],
  })),
  has_booking: subqueryField((_op, _pi) => ({
    sql: `EXISTS (SELECT 1 FROM bookings b WHERE b.angler_id = p.id)`,
    params: [],
  })),

  // Lead fields — joined from leads table
  "lead.interest_type": subqueryField((_op, _pi) => ({
    sql: `EXISTS (SELECT 1 FROM leads l WHERE l.email = p.email AND l.interest_type`,
    params: [],
  })),
  "lead.source": subqueryField((_op, _pi) => ({
    sql: `EXISTS (SELECT 1 FROM leads l WHERE l.email = p.email AND l.source`,
    params: [],
  })),

  // Engagement aggregates — subqueries against campaign_sends
  "engagement.last_opened_at": subqueryField((_op, _pi) => ({
    sql: `(SELECT MAX(cs.opened_at) FROM campaign_sends cs WHERE cs.recipient_id = p.id)`,
    params: [],
  })),
  "engagement.total_opens": subqueryField((_op, _pi) => ({
    sql: `(SELECT COALESCE(SUM(cs.open_count), 0) FROM campaign_sends cs WHERE cs.recipient_id = p.id)`,
    params: [],
  })),
};

// ─── Condition → SQL ────────────────────────────────────────────────

/**
 * Build a SQL WHERE clause fragment for a single condition.
 * Returns the clause and an array of parameter values.
 *
 * @param condition  The segment condition to translate
 * @param paramStart The starting $N parameter index (1-based)
 * @returns          The SQL fragment with parameterized values
 */
export function buildConditionSql(
  condition: SegmentCondition,
  paramStart: number
): SqlFragment {
  const mapping = FIELD_MAP[condition.field];
  if (!mapping) {
    throw new Error(`Unknown segment field: ${condition.field}`);
  }

  const { op, value } = condition;

  // ── Nullary operators (is_null / not_null) ──
  if (op === "is_null" || op === "not_null") {
    const sqlOp = SQL_OPS[op];

    if (mapping.category === "profile") {
      return { sql: `p.${mapping.column} ${sqlOp}`, params: [] };
    }

    // Subquery nullary
    if (condition.field === "has_booking") {
      return op === "is_null"
        ? { sql: `NOT EXISTS (SELECT 1 FROM bookings b WHERE b.angler_id = p.id)`, params: [] }
        : { sql: `EXISTS (SELECT 1 FROM bookings b WHERE b.angler_id = p.id)`, params: [] };
    }

    // Aggregate nullary
    const sub = mapping.buildSubquery!(op, paramStart);
    return { sql: `${sub.sql} ${sqlOp}`, params: [] };
  }

  // ── Boolean field: has_booking ──
  if (condition.field === "has_booking") {
    const boolVal = value === true || value === "true" || value === 1;
    return boolVal
      ? { sql: `EXISTS (SELECT 1 FROM bookings b WHERE b.angler_id = p.id)`, params: [] }
      : { sql: `NOT EXISTS (SELECT 1 FROM bookings b WHERE b.angler_id = p.id)`, params: [] };
  }

  // ── Array operators (in / not_in) ──
  if (op === "in" || op === "not_in") {
    const arr = Array.isArray(value) ? value : [value];
    const placeholder = `$${paramStart}`;

    if (mapping.category === "profile") {
      const sqlOp = op === "in" ? "= ANY" : "!= ALL";
      return {
        sql: `p.${mapping.column} ${sqlOp}(${placeholder}::text[])`,
        params: [arr],
      };
    }

    // EXISTS subquery with array check
    const sub = mapping.buildSubquery!(op, paramStart);
    const sqlOp = op === "in" ? "= ANY" : "!= ALL";
    return {
      sql: `${sub.sql} ${sqlOp}(${placeholder}::text[]))`,
      params: [arr],
    };
  }

  // ── BETWEEN operator ──
  if (op === "between") {
    const [lo, hi] = Array.isArray(value) ? value : [value, value];

    if (mapping.category === "profile") {
      return {
        sql: `p.${mapping.column} BETWEEN $${paramStart} AND $${paramStart + 1}`,
        params: [lo, hi],
      };
    }

    const sub = mapping.buildSubquery!(op, paramStart);
    return {
      sql: `${sub.sql} BETWEEN $${paramStart} AND $${paramStart + 1}`,
      params: [lo, hi],
    };
  }

  // ── CONTAINS / NOT CONTAINS (ILIKE) ──
  if (op === "contains" || op === "not_contains") {
    const sqlOp = SQL_OPS[op];
    const likeVal = `%${String(value).replace(/%/g, "\\%")}%`;

    if (mapping.category === "profile") {
      // For array columns (favorite_species), use array_to_string
      if (condition.field === "favorite_species") {
        return {
          sql: `array_to_string(p.favorite_species, ',') ${sqlOp} $${paramStart}`,
          params: [likeVal],
        };
      }
      return {
        sql: `p.${mapping.column}::text ${sqlOp} $${paramStart}`,
        params: [likeVal],
      };
    }

    const sub = mapping.buildSubquery!(op, paramStart);
    return {
      sql: `${sub.sql} ${sqlOp} $${paramStart})`,
      params: [likeVal],
    };
  }

  // ── Standard comparison operators ──
  const sqlOp = SQL_OPS[op];

  if (mapping.category === "profile") {
    return {
      sql: `p.${mapping.column} ${sqlOp} $${paramStart}`,
      params: [value],
    };
  }

  // Subquery with comparison
  const sub = mapping.buildSubquery!(op, paramStart);

  // For EXISTS-based subqueries (club_membership, lead), close the EXISTS
  if (sub.sql.startsWith("EXISTS")) {
    return {
      sql: `${sub.sql} ${sqlOp} $${paramStart})`,
      params: [value],
    };
  }

  // For scalar subqueries (booking_count, engagement.total_opens, etc.)
  return {
    sql: `${sub.sql} ${sqlOp} $${paramStart}`,
    params: [value],
  };
}

// ─── Rule Group → SQL ───────────────────────────────────────────────

/**
 * Build a SQL WHERE clause for a rule group.
 */
export function buildGroupSql(
  group: SegmentRuleGroup,
  paramStart: number
): SqlFragment {
  if (group.conditions.length === 0) {
    return { sql: "TRUE", params: [] };
  }

  const joiner = group.match === "all" ? " AND " : " OR ";
  const fragments: string[] = [];
  const allParams: unknown[] = [];
  let paramIndex = paramStart;

  for (const condition of group.conditions) {
    const frag = buildConditionSql(condition, paramIndex);
    fragments.push(frag.sql);
    allParams.push(...frag.params);
    paramIndex += frag.params.length;
  }

  return {
    sql: `(${fragments.join(joiner)})`,
    params: allParams,
  };
}

// ─── Full Segment → SQL ─────────────────────────────────────────────

/**
 * Build the complete SQL query for a segment's rules.
 * Returns a SELECT query against the profiles table with all necessary
 * subqueries and joins for the segment conditions.
 *
 * Multiple rule groups are combined with OR.
 */
export function buildSegmentQuery(
  rules: SegmentRuleGroup[],
  options: {
    select?: string;
    limit?: number;
    countOnly?: boolean;
  } = {}
): SqlFragment {
  const { select = "p.id, p.email, p.display_name, p.role", limit, countOnly } = options;

  if (!rules || rules.length === 0) {
    const selectClause = countOnly ? "COUNT(*)" : select;
    return {
      sql: `SELECT ${selectClause} FROM profiles p WHERE TRUE`,
      params: [],
    };
  }

  const groupFragments: string[] = [];
  const allParams: unknown[] = [];
  let paramIndex = 1;

  for (const group of rules) {
    const frag = buildGroupSql(group, paramIndex);
    groupFragments.push(frag.sql);
    allParams.push(...frag.params);
    paramIndex += frag.params.length;
  }

  const whereClause = groupFragments.join(" OR ");
  const selectClause = countOnly ? "COUNT(*) as count" : select;

  let sql = `SELECT ${selectClause} FROM profiles p WHERE ${whereClause}`;

  if (!countOnly && limit) {
    sql += ` LIMIT ${limit}`;
  }

  return { sql, params: allParams };
}
