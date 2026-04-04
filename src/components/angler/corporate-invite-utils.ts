// ─── Types ──────────────────────────────────────────────────────────

export interface CorporateInviteSectionProps {
  membershipId: string;
  clubId: string;
  clubName: string;
  companyName: string;
}

export interface Invitation {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

export interface SkippedEmail {
  email: string;
  reason: string;
}

// ─── CSV Parsing ────────────────────────────────────────────────────

const EMAIL_HEADER_PATTERNS = [
  "email",
  "e-mail",
  "email address",
  "emailaddress",
  "e-mail address",
  "mail",
];

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export function extractEmailsFromCSV(text: string): string[] {
  const cleaned = stripBom(text);
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headerFields = parseCSVLine(lines[0]);
  const emailColIndex = headerFields.findIndex((h) =>
    EMAIL_HEADER_PATTERNS.includes(h.toLowerCase().trim())
  );

  if (emailColIndex >= 0) {
    // Header found - extract from that column
    return lines.slice(1).map((line) => {
      const fields = parseCSVLine(line);
      return fields[emailColIndex]?.trim() ?? "";
    });
  }

  // No header found - try to extract emails from all fields
  const emails: string[] = [];
  for (const line of lines) {
    const fields = parseCSVLine(line);
    for (const field of fields) {
      const trimmed = field.trim();
      if (isValidEmail(trimmed)) {
        emails.push(trimmed);
      }
    }
  }
  return emails;
}

// ─── Email Validation ───────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function parseEmailInput(input: string): string[] {
  // Split on commas, semicolons, newlines, or spaces followed by email-like strings
  return input
    .split(/[,;\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
