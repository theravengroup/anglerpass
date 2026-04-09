/**
 * Email HTML serializer — converts builder blocks into
 * email-safe inline-styled HTML.
 *
 * All styles are inlined because email clients strip <style> tags.
 * Uses table-based layout for maximum compatibility.
 */

import type { EmailBlock } from "./types";

// ─── Brand Colors (inline, not Tailwind) ────────────────────────────

const COLORS = {
  primary: "#1a3a2a",
  primaryHover: "#142e22",
  secondary: "#4a7c6f",
  text: "#1e1e1a",
  textLight: "#5a5a52",
  textMuted: "#9a9a8e",
  border: "#e0dfd8",
  bg: "#ffffff",
  bgLight: "#f9f8f5",
} as const;

const FONT_STACK = "Georgia, 'Times New Roman', serif";
const SANS_STACK = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Block Serializers ──────────────────────────────────────────────

function serializeHeading(block: Extract<EmailBlock, { type: "heading" }>): string {
  const sizes = { 1: "28px", 2: "22px", 3: "18px" } as const;
  const fontSize = sizes[block.level];
  const tag = `h${block.level}` as const;

  return `<${tag} style="margin: 0 0 12px 0; font-family: ${FONT_STACK}; font-size: ${fontSize}; font-weight: 600; color: ${COLORS.text}; text-align: ${block.align}; line-height: 1.3;">${escapeHtml(block.content)}</${tag}>`;
}

function serializeText(block: Extract<EmailBlock, { type: "text" }>): string {
  // Allow basic HTML in text blocks (bold, italic, links)
  return `<p style="margin: 0 0 16px 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.7; color: ${COLORS.textLight}; text-align: ${block.align};">${block.content}</p>`;
}

function serializeImage(block: Extract<EmailBlock, { type: "image" }>): string {
  if (!block.src) {
    return `<div style="margin: 0 0 16px 0; padding: 40px 20px; background: ${COLORS.bgLight}; border: 1px dashed ${COLORS.border}; text-align: center; font-family: ${SANS_STACK}; font-size: 13px; color: ${COLORS.textMuted};">Image placeholder — add a URL in the builder</div>`;
  }

  const widthStyle = block.width === "full" ? "100%" : block.width === "half" ? "50%" : "auto";
  const alignStyle = block.align === "center"
    ? "margin: 0 auto 16px auto; display: block;"
    : block.align === "right"
      ? "margin: 0 0 16px auto; display: block;"
      : "margin: 0 0 16px 0; display: block;";

  const img = `<img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}" width="${widthStyle}" style="max-width: 100%; height: auto; ${alignStyle} border: 0;" />`;

  if (block.href) {
    return `<a href="${escapeAttr(block.href)}" style="text-decoration: none;">${img}</a>`;
  }
  return img;
}

function serializeButton(block: Extract<EmailBlock, { type: "button" }>): string {
  const variants = {
    primary: `background: ${COLORS.primary}; color: #ffffff; border: 2px solid ${COLORS.primary};`,
    secondary: `background: ${COLORS.secondary}; color: #ffffff; border: 2px solid ${COLORS.secondary};`,
    outline: `background: transparent; color: ${COLORS.primary}; border: 2px solid ${COLORS.primary};`,
  } as const;

  const alignMap = {
    left: "margin: 0 auto 16px 0;",
    center: "margin: 0 auto 16px auto;",
    right: "margin: 0 0 16px auto;",
  } as const;

  // Use table-based button for Outlook compatibility
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${alignMap[block.align]}">
  <tr>
    <td style="border-radius: 6px; ${variants[block.variant]}">
      <a href="${escapeAttr(block.href)}" style="display: inline-block; padding: 14px 32px; font-family: ${SANS_STACK}; font-size: 14px; font-weight: 500; letter-spacing: 0.3px; text-decoration: none; ${variants[block.variant]} border-radius: 6px;">
        ${escapeHtml(block.label)}
      </a>
    </td>
  </tr>
</table>`;
}

function serializeDivider(block: Extract<EmailBlock, { type: "divider" }>): string {
  return `<hr style="margin: 24px 0; border: 0; border-top: 1px ${block.style} ${COLORS.border};" />`;
}

function serializeSpacer(block: Extract<EmailBlock, { type: "spacer" }>): string {
  return `<div style="height: ${block.height}px; line-height: ${block.height}px; font-size: 1px;">&nbsp;</div>`;
}

function serializeColumns(block: Extract<EmailBlock, { type: "columns" }>): string {
  const splits = {
    "50-50": ["50%", "50%"],
    "33-67": ["33%", "67%"],
    "67-33": ["67%", "33%"],
  } as const;

  const [leftWidth, rightWidth] = splits[block.layout];

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 16px 0;">
  <tr>
    <td width="${leftWidth}" valign="top" style="padding-right: 12px; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.7; color: ${COLORS.textLight};">
      ${block.left}
    </td>
    <td width="${rightWidth}" valign="top" style="padding-left: 12px; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.7; color: ${COLORS.textLight};">
      ${block.right}
    </td>
  </tr>
</table>`;
}

// ─── Main Serializer ────────────────────────────────────────────────

/**
 * Serialize an array of email blocks into email-safe HTML.
 * Does NOT include the outer wrapper, greeting, unsubscribe footer,
 * or tracking pixel — those are added by `buildCrmEmailHtml()`.
 */
export function serializeBlocks(blocks: EmailBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return serializeHeading(block);
        case "text":
          return serializeText(block);
        case "image":
          return serializeImage(block);
        case "button":
          return serializeButton(block);
        case "divider":
          return serializeDivider(block);
        case "spacer":
          return serializeSpacer(block);
        case "columns":
          return serializeColumns(block);
      }
    })
    .join("\n");
}

/**
 * Parse HTML back into blocks (best-effort).
 * Used when loading an existing step that was created with the builder.
 * Falls back to a single text block if parsing fails.
 */
export function parseHtmlToBlocks(html: string): EmailBlock[] {
  if (!html || html.trim() === "") {
    return [];
  }

  // If the HTML looks like it was created by the builder (has our markers),
  // try to extract blocks. Otherwise, wrap in a single text block.
  // For now, we wrap everything in a text block — a richer parser can
  // be added later.
  return [
    {
      id: crypto.randomUUID(),
      type: "text",
      content: html,
      align: "left",
    },
  ];
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

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
