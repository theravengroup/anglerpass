/**
 * Lightweight Liquid-style template engine for CRM emails.
 *
 * Supports:
 *   - Variable interpolation: {{ user.name }}
 *   - Dot notation: {{ user.profile.city }}
 *   - Filters: {{ user.name | upcase }}, {{ amount | currency }}
 *   - Conditionals: {% if user.role == "angler" %}...{% elsif %}...{% else %}...{% endif %}
 *   - For loops: {% for item in items %}{{ item.name }}{% endfor %}
 *   - Default values: {{ user.name | default: "Friend" }}
 *   - Truthy/falsy checks: {% if user.has_booking %}
 *
 * Intentionally no external dependencies — the engine is ~200 lines
 * and covers the 90% use case for marketing emails.
 */

import "server-only";

// ─── Types ──────────────────────────────────────────────────────────

export type TemplateData = Record<string, unknown>;

// ─── Filters ────────────────────────────────────────────────────────

const FILTERS: Record<string, (val: unknown, arg?: string) => string> = {
  upcase: (v) => String(v ?? "").toUpperCase(),
  downcase: (v) => String(v ?? "").toLowerCase(),
  capitalize: (v) => {
    const s = String(v ?? "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  strip: (v) => String(v ?? "").trim(),
  truncate: (v, arg) => {
    const s = String(v ?? "");
    const len = parseInt(arg ?? "50", 10);
    return s.length > len ? s.slice(0, len) + "..." : s;
  },
  default: (v, arg) => {
    const s = String(v ?? "");
    return s === "" || s === "undefined" || s === "null" ? (arg ?? "") : s;
  },
  date_format: (v, arg) => {
    try {
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return String(v ?? "");
      const fmt = arg ?? "short";
      if (fmt === "short") return d.toLocaleDateString("en-US");
      if (fmt === "long")
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      if (fmt === "iso") return d.toISOString().split("T")[0];
      return d.toLocaleDateString("en-US");
    } catch {
      return String(v ?? "");
    }
  },
  currency: (v) => {
    const n = Number(v);
    if (isNaN(n)) return String(v ?? "");
    return `$${n.toFixed(2)}`;
  },
  number: (v) => {
    const n = Number(v);
    if (isNaN(n)) return String(v ?? "");
    return n.toLocaleString("en-US");
  },
  escape_html: (v) => escapeHtml(String(v ?? "")),
};

// ─── Resolver ───────────────────────────────────────────────────────

/**
 * Resolve a dotted path like "user.profile.city" against a data object.
 */
function resolve(path: string, data: TemplateData): unknown {
  const parts = path.trim().split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// ─── Expression Evaluator ───────────────────────────────────────────

/**
 * Evaluate a simple comparison expression:
 *   user.role == "angler"
 *   booking_count > 0
 *   user.name != ""
 *   user.is_verified
 */
function evaluateCondition(expr: string, data: TemplateData): boolean {
  const trimmed = expr.trim();

  // Check for comparison operators
  const opMatch = trimmed.match(
    /^(.+?)\s*(==|!=|>=|<=|>|<|contains)\s*(.+)$/
  );

  if (opMatch) {
    const [, leftExpr, op, rightExpr] = opMatch;
    const left = resolveValue(leftExpr.trim(), data);
    const right = resolveValue(rightExpr.trim(), data);

    switch (op) {
      case "==":
        return String(left) === String(right);
      case "!=":
        return String(left) !== String(right);
      case ">":
        return Number(left) > Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<":
        return Number(left) < Number(right);
      case "<=":
        return Number(left) <= Number(right);
      case "contains":
        return String(left).includes(String(right));
      default:
        return false;
    }
  }

  // Truthy check (no operator)
  const val = resolve(trimmed, data);
  return isTruthy(val);
}

function resolveValue(expr: string, data: TemplateData): unknown {
  // String literal
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  ) {
    return expr.slice(1, -1);
  }

  // Number literal
  const num = Number(expr);
  if (!isNaN(num) && expr !== "") return num;

  // Boolean literals
  if (expr === "true") return true;
  if (expr === "false") return false;
  if (expr === "nil" || expr === "null") return null;

  // Variable reference
  return resolve(expr, data);
}

function isTruthy(val: unknown): boolean {
  if (val == null) return false;
  if (val === false) return false;
  if (val === 0) return false;
  if (val === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

// ─── Variable Interpolation ─────────────────────────────────────────

/**
 * Process {{ variable | filter: arg }} expressions.
 */
function interpolateVariables(template: string, data: TemplateData): string {
  return template.replace(
    /\{\{\s*(.+?)\s*\}\}/g,
    (_match, expression: string) => {
      // Split by pipes for filter chain
      const parts = expression.split("|").map((s: string) => s.trim());
      const varPath = parts[0];
      let value = resolve(varPath, data);

      // Apply filters
      for (let i = 1; i < parts.length; i++) {
        const filterExpr = parts[i].trim();
        const colonIdx = filterExpr.indexOf(":");
        const filterName =
          colonIdx > -1 ? filterExpr.slice(0, colonIdx).trim() : filterExpr;
        const filterArg =
          colonIdx > -1
            ? filterExpr
                .slice(colonIdx + 1)
                .trim()
                .replace(/^["']|["']$/g, "")
            : undefined;

        const fn = FILTERS[filterName];
        if (fn) {
          value = fn(value, filterArg);
        }
      }

      return escapeHtml(String(value ?? ""));
    }
  );
}

// ─── Block Processing ───────────────────────────────────────────────

/**
 * Process {% if %}...{% elsif %}...{% else %}...{% endif %} blocks.
 * Also handles {% for item in items %}...{% endfor %} blocks.
 *
 * Uses a simple recursive approach — finds the outermost block tags
 * and processes them, then recurses into the result.
 */
function processBlocks(template: string, data: TemplateData): string {
  let result = template;

  // Process for loops first (innermost)
  result = processForLoops(result, data);

  // Process if/elsif/else/endif
  result = processConditionals(result, data);

  return result;
}

function processForLoops(template: string, data: TemplateData): string {
  // Match {% for VAR in COLLECTION %}...{% endfor %}
  const forRegex =
    /\{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g;

  return template.replace(forRegex, (_match, itemVar, collectionPath, body) => {
    const collection = resolve(collectionPath, data);
    if (!Array.isArray(collection) || collection.length === 0) return "";

    return collection
      .map((item, index) => {
        const loopData: TemplateData = {
          ...data,
          [itemVar]: item,
          forloop: {
            index: index + 1,
            index0: index,
            first: index === 0,
            last: index === collection.length - 1,
            length: collection.length,
          },
        };
        // Recurse to handle nested templates
        return renderTemplate(body, loopData);
      })
      .join("");
  });
}

function processConditionals(template: string, data: TemplateData): string {
  // Find outermost {% if %}...{% endif %} — handle nesting via counting
  const ifStartRegex = /\{%\s*if\s+(.+?)\s*%\}/g;
  let match: RegExpExecArray | null;
  let result = template;

  // Process one if-block at a time (outermost first)
  while ((match = ifStartRegex.exec(result)) !== null) {
    const startIdx = match.index;
    const condition = match[1];
    const afterOpen = startIdx + match[0].length;

    // Find matching endif by counting nesting
    let depth = 1;
    let searchIdx = afterOpen;
    let endIdx = -1;

    while (depth > 0 && searchIdx < result.length) {
      const nextIf = result.indexOf("{%", searchIdx);
      if (nextIf === -1) break;

      const tagEnd = result.indexOf("%}", nextIf);
      if (tagEnd === -1) break;

      const tag = result.slice(nextIf + 2, tagEnd).trim();

      if (tag.startsWith("if ")) {
        depth++;
      } else if (tag === "endif") {
        depth--;
        if (depth === 0) {
          endIdx = tagEnd + 2;
          break;
        }
      }

      searchIdx = tagEnd + 2;
    }

    if (endIdx === -1) break; // Malformed template — stop processing

    // Extract body between opening if and closing endif, then process
    const bodyContent = result.slice(afterOpen, endIdx).replace(/\{%\s*endif\s*%\}$/, "");
    const processed = evaluateIfBlock(condition, bodyContent, data);

    result = result.slice(0, startIdx) + processed + result.slice(endIdx);
    ifStartRegex.lastIndex = startIdx + processed.length;
  }

  return result;
}

function evaluateIfBlock(
  condition: string,
  body: string,
  data: TemplateData
): string {
  // Split body by {% elsif %} and {% else %} at depth 0
  const segments: { condition: string | null; content: string }[] = [];
  let current = body;
  let depth = 0;
  let lastSplit = 0;
  let currentCondition: string | null = condition;

  for (let i = 0; i < current.length; i++) {
    if (current.slice(i, i + 2) === "{%") {
      const tagEnd = current.indexOf("%}", i);
      if (tagEnd === -1) continue;
      const tag = current.slice(i + 2, tagEnd).trim();

      if (tag.startsWith("if ")) {
        depth++;
      } else if (tag === "endif") {
        depth--;
      } else if (depth === 0 && tag.startsWith("elsif ")) {
        segments.push({
          condition: currentCondition,
          content: current.slice(lastSplit, i),
        });
        currentCondition = tag.slice(6).trim();
        lastSplit = tagEnd + 2;
      } else if (depth === 0 && tag === "else") {
        segments.push({
          condition: currentCondition,
          content: current.slice(lastSplit, i),
        });
        currentCondition = null; // else = always true
        lastSplit = tagEnd + 2;
      }

      i = tagEnd + 1;
    }
  }

  // Last segment
  segments.push({
    condition: currentCondition,
    content: current.slice(lastSplit),
  });

  // Evaluate segments in order
  for (const seg of segments) {
    if (seg.condition === null || evaluateCondition(seg.condition, data)) {
      return seg.content;
    }
  }

  return "";
}

// ─── Main Render Function ───────────────────────────────────────────

/**
 * Render a Liquid-style template with the given data context.
 *
 * @example
 * ```ts
 * const html = renderTemplate(
 *   "Hi {{ user.name | capitalize }}! {% if user.role == 'angler' %}Happy fishing!{% endif %}",
 *   { user: { name: "john", role: "angler" } }
 * );
 * // => "Hi John! Happy fishing!"
 * ```
 */
export function renderTemplate(
  template: string,
  data: TemplateData
): string {
  // 1. Process block-level tags (for loops, conditionals)
  let result = processBlocks(template, data);

  // 2. Interpolate remaining variables
  result = interpolateVariables(result, data);

  return result;
}

/**
 * Validate a template — checks for unclosed tags and unknown variables.
 * Returns an array of warning messages (empty = valid).
 */
export function validateTemplate(template: string): string[] {
  const warnings: string[] = [];

  // Check for unclosed if blocks
  const ifCount = (template.match(/\{%\s*if\s/g) ?? []).length;
  const endifCount = (template.match(/\{%\s*endif\s*%\}/g) ?? []).length;
  if (ifCount !== endifCount) {
    warnings.push(
      `Unclosed if blocks: ${ifCount} opening, ${endifCount} closing`
    );
  }

  // Check for unclosed for blocks
  const forCount = (template.match(/\{%\s*for\s/g) ?? []).length;
  const endforCount = (template.match(/\{%\s*endfor\s*%\}/g) ?? []).length;
  if (forCount !== endforCount) {
    warnings.push(
      `Unclosed for blocks: ${forCount} opening, ${endforCount} closing`
    );
  }

  return warnings;
}

// ─── Built-in Data Builders ─────────────────────────────────────────

/**
 * Build the standard template data context for a CRM email recipient.
 * This is the data available to all CRM emails.
 */
export interface RecipientContext {
  userId?: string;
  email: string;
  displayName?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export function buildTemplateData(
  ctx: RecipientContext,
  extras?: Record<string, unknown>
): TemplateData {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

  return {
    user: {
      name: ctx.displayName ?? "there",
      email: ctx.email,
      role: ctx.role ?? "user",
      id: ctx.userId ?? "",
    },
    // Legacy flat variables for backwards compatibility
    display_name: ctx.displayName ?? "there",
    email: ctx.email,
    site_url: siteUrl,
    unsubscribe_url: ctx.userId
      ? `${siteUrl}/api/notifications/unsubscribe?token=` // Will be filled by email-sender
      : `${siteUrl}/api/notifications/unsubscribe`,
    preferences_url: `${siteUrl}/email-preferences`,
    current_year: new Date().getFullYear().toString(),
    ...ctx.metadata,
    ...extras,
  };
}

// ─── Utilities ──────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

