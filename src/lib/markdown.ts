/**
 * Sanitize a string for safe insertion into HTML.
 * Escapes &, <, >, ", and ' to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validate and sanitize a URL for use in href attributes.
 * Only allows http, https, and mailto protocols.
 */
function sanitizeHref(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/")
  ) {
    return escapeHtml(trimmed);
  }
  return "#";
}

/** Inline markdown: bold, links. All text is escaped for XSS safety. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="text-forest font-semibold">$1</strong>'
    )
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      (_match, label: string, url: string) =>
        `<a href="${sanitizeHref(url)}" class="text-river underline hover:text-forest transition-colors">${label}</a>`
    );
}

/**
 * Simple markdown-to-HTML converter for headings, paragraphs, and unordered lists.
 * All user-derived text is HTML-escaped. URLs are validated against an allowlist
 * of safe protocols (https, http, mailto, relative paths).
 */
export function renderMarkdown(content: string): string {
  return content
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // Headings
      if (trimmed.startsWith('### '))
        return `<h3 class="font-heading text-[20px] font-semibold text-forest mt-10 mb-3 tracking-[-0.2px]">${inline(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith('## '))
        return `<h2 class="font-heading text-[24px] font-semibold text-forest mt-12 mb-4 tracking-[-0.3px]">${inline(trimmed.slice(3))}</h2>`;

      // Unordered list
      if (trimmed.startsWith('- ')) {
        const items = trimmed
          .split('\n')
          .filter((l) => l.startsWith('- '))
          .map(
            (l) =>
              `<li class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-forest/50">${inline(l.slice(2))}</li>`
          )
          .join('');
        return `<ul class="list-none p-0 space-y-1.5 mb-4">${items}</ul>`;
      }

      // Paragraph
      return `<p class="text-[16px] leading-[1.75] text-text-secondary mb-4">${inline(trimmed)}</p>`;
    })
    .join('\n');
}
