/**
 * Spam score analyzer — checks email content for common spam triggers
 * and returns a score from 0 (clean) to 10 (very spammy) along with
 * specific issues found.
 *
 * This is a client-side heuristic analysis, not a full SpamAssassin
 * replacement. It catches the most common issues that cause emails
 * to land in spam folders.
 */

export interface SpamCheckResult {
  score: number; // 0-10
  rating: "excellent" | "good" | "warning" | "poor";
  issues: SpamIssue[];
  suggestions: string[];
}

export interface SpamIssue {
  severity: "low" | "medium" | "high";
  category: string;
  message: string;
  points: number; // How much this adds to the spam score
}

/**
 * Analyze an email for spam triggers.
 */
export function analyzeSpamScore(opts: {
  subject: string;
  htmlBody: string;
  fromName: string;
  fromEmail: string;
}): SpamCheckResult {
  const issues: SpamIssue[] = [];
  const suggestions: string[] = [];

  // ── Subject Line Checks ────────────────────────────────────────

  if (!opts.subject || opts.subject.trim().length === 0) {
    issues.push({
      severity: "high",
      category: "subject",
      message: "Missing subject line",
      points: 3,
    });
  } else {
    // All caps
    if (opts.subject === opts.subject.toUpperCase() && opts.subject.length > 5) {
      issues.push({
        severity: "medium",
        category: "subject",
        message: "Subject line is all uppercase",
        points: 1.5,
      });
    }

    // Excessive punctuation
    const exclamations = (opts.subject.match(/!/g) ?? []).length;
    if (exclamations > 1) {
      issues.push({
        severity: "medium",
        category: "subject",
        message: `Too many exclamation marks (${exclamations})`,
        points: 1,
      });
    }

    // Spam trigger words in subject
    const subjectSpamWords = checkSpamWords(opts.subject);
    if (subjectSpamWords.length > 0) {
      issues.push({
        severity: "medium",
        category: "subject",
        message: `Spam trigger words: ${subjectSpamWords.join(", ")}`,
        points: Math.min(subjectSpamWords.length * 0.5, 2),
      });
    }

    // Too long
    if (opts.subject.length > 80) {
      issues.push({
        severity: "low",
        category: "subject",
        message: `Subject line too long (${opts.subject.length} chars, aim for under 60)`,
        points: 0.5,
      });
      suggestions.push("Keep subject lines under 60 characters for best deliverability");
    }

    // RE: or FW: tricks
    if (/^(re:|fw:|fwd:)/i.test(opts.subject)) {
      issues.push({
        severity: "high",
        category: "subject",
        message: "Fake RE:/FW: prefix",
        points: 2,
      });
    }
  }

  // ── Body Content Checks ────────────────────────────────────────

  const body = opts.htmlBody;
  const textContent = stripHtml(body);

  if (!body || body.trim().length === 0) {
    issues.push({
      severity: "high",
      category: "body",
      message: "Empty email body",
      points: 3,
    });
  } else {
    // All caps in body
    const capsRatio = countUpperCase(textContent) / Math.max(textContent.length, 1);
    if (capsRatio > 0.5 && textContent.length > 50) {
      issues.push({
        severity: "medium",
        category: "body",
        message: `High percentage of uppercase text (${Math.round(capsRatio * 100)}%)`,
        points: 1,
      });
    }

    // Spam words in body
    const bodySpamWords = checkSpamWords(textContent);
    if (bodySpamWords.length > 2) {
      issues.push({
        severity: "medium",
        category: "body",
        message: `Spam trigger words in body: ${bodySpamWords.slice(0, 5).join(", ")}${bodySpamWords.length > 5 ? "..." : ""}`,
        points: Math.min(bodySpamWords.length * 0.3, 2),
      });
    }

    // Image-to-text ratio
    const imgCount = (body.match(/<img/gi) ?? []).length;
    if (imgCount > 0 && textContent.length < 100) {
      issues.push({
        severity: "medium",
        category: "body",
        message: "Too many images with too little text",
        points: 1.5,
      });
      suggestions.push(
        "Add more text content — emails with high image-to-text ratio often land in spam"
      );
    }

    // Missing unsubscribe link
    if (
      !body.includes("unsubscribe") &&
      !body.includes("email-preferences") &&
      !body.includes("opt-out")
    ) {
      issues.push({
        severity: "high",
        category: "compliance",
        message: "No unsubscribe link found",
        points: 2,
      });
      suggestions.push(
        "Add an unsubscribe link — it's required by CAN-SPAM and helps deliverability"
      );
    }

    // Link count
    const linkCount = (body.match(/<a\s/gi) ?? []).length;
    if (linkCount > 10) {
      issues.push({
        severity: "low",
        category: "body",
        message: `High link count (${linkCount} links)`,
        points: 0.5,
      });
    }

    // URL shorteners
    if (/bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly/i.test(body)) {
      issues.push({
        severity: "high",
        category: "body",
        message: "URL shortener detected — these are often flagged as spam",
        points: 2,
      });
      suggestions.push("Use full URLs instead of URL shorteners");
    }

    // Color abuse (too many different colors)
    const colorCount = (body.match(/color\s*[:=]\s*["']?#/gi) ?? []).length;
    if (colorCount > 8) {
      issues.push({
        severity: "low",
        category: "body",
        message: "Excessive use of different colors",
        points: 0.5,
      });
    }

    // Large font sizes
    if (/font-size\s*:\s*(\d+)/.test(body)) {
      const sizes = [...body.matchAll(/font-size\s*:\s*(\d+)/g)].map((m) =>
        Number(m[1])
      );
      const maxSize = Math.max(...sizes);
      if (maxSize > 32) {
        issues.push({
          severity: "low",
          category: "body",
          message: `Very large font size detected (${maxSize}px)`,
          points: 0.5,
        });
      }
    }
  }

  // ── Sender Checks ──────────────────────────────────────────────

  if (!opts.fromName || opts.fromName.trim().length === 0) {
    issues.push({
      severity: "medium",
      category: "sender",
      message: "Missing from name",
      points: 1,
    });
  }

  if (opts.fromEmail && /noreply|no-reply/i.test(opts.fromEmail)) {
    issues.push({
      severity: "low",
      category: "sender",
      message: "Using a noreply email address",
      points: 0.5,
    });
    suggestions.push(
      "Use a real reply-to address — noreply emails have lower engagement"
    );
  }

  // ── Calculate Score ────────────────────────────────────────────

  const totalPoints = issues.reduce((sum, i) => sum + i.points, 0);
  const score = Math.min(10, Math.round(totalPoints * 10) / 10);

  let rating: SpamCheckResult["rating"];
  if (score <= 1) rating = "excellent";
  else if (score <= 3) rating = "good";
  else if (score <= 6) rating = "warning";
  else rating = "poor";

  if (score <= 1 && suggestions.length === 0) {
    suggestions.push("Your email looks clean and should have good deliverability");
  }

  return { score, rating, issues, suggestions };
}

// ─── Preflight Checklist ───────────────────────────────────────────

export interface PreflightCheck {
  label: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

export function runPreflightChecklist(opts: {
  subject: string;
  htmlBody: string;
  fromName: string;
  fromEmail: string;
  recipientCount?: number;
}): PreflightCheck[] {
  const checks: PreflightCheck[] = [];

  // Subject
  checks.push({
    label: "Subject line",
    passed: opts.subject.trim().length > 0,
    message: opts.subject.trim().length > 0 ? "Subject line is set" : "Missing subject line",
    severity: opts.subject.trim().length > 0 ? "info" : "error",
  });

  // Body
  checks.push({
    label: "Email body",
    passed: opts.htmlBody.trim().length > 50,
    message:
      opts.htmlBody.trim().length > 50
        ? "Email body has content"
        : "Email body is too short or empty",
    severity: opts.htmlBody.trim().length > 50 ? "info" : "error",
  });

  // From name
  checks.push({
    label: "From name",
    passed: opts.fromName.trim().length > 0,
    message: opts.fromName.trim().length > 0 ? `Sending as "${opts.fromName}"` : "Missing from name",
    severity: opts.fromName.trim().length > 0 ? "info" : "warning",
  });

  // Unsubscribe link
  const hasUnsub =
    opts.htmlBody.includes("unsubscribe") ||
    opts.htmlBody.includes("email-preferences");
  checks.push({
    label: "Unsubscribe link",
    passed: hasUnsub,
    message: hasUnsub
      ? "Unsubscribe link present"
      : "No unsubscribe link found (required by CAN-SPAM)",
    severity: hasUnsub ? "info" : "error",
  });

  // Personalization
  const hasPersonalization = /\{\{.*?\}\}/.test(opts.htmlBody) || /\{\{.*?\}\}/.test(opts.subject);
  checks.push({
    label: "Personalization",
    passed: hasPersonalization,
    message: hasPersonalization
      ? "Uses template variables"
      : "No personalization — consider adding {{ user.name }}",
    severity: hasPersonalization ? "info" : "warning",
  });

  // Preview text (first 100 chars of text content)
  const previewText = stripHtml(opts.htmlBody).substring(0, 100).trim();
  checks.push({
    label: "Preview text",
    passed: previewText.length > 20,
    message:
      previewText.length > 20
        ? `Preview: "${previewText.substring(0, 50)}..."`
        : "Preview text is too short — recipients may see HTML artifacts",
    severity: previewText.length > 20 ? "info" : "warning",
  });

  // Broken images
  const imgTags = opts.htmlBody.match(/<img[^>]*src=["']([^"']*)["']/gi) ?? [];
  const brokenImgs = imgTags.filter(
    (tag) => !tag.includes("http") && !tag.includes("{{")
  );
  checks.push({
    label: "Images",
    passed: brokenImgs.length === 0,
    message:
      brokenImgs.length === 0
        ? `${imgTags.length} image${imgTags.length !== 1 ? "s" : ""} found with valid URLs`
        : `${brokenImgs.length} image${brokenImgs.length !== 1 ? "s" : ""} with potentially broken URLs`,
    severity: brokenImgs.length === 0 ? "info" : "warning",
  });

  // Spam score
  const spamResult = analyzeSpamScore(opts);
  checks.push({
    label: "Spam score",
    passed: spamResult.score <= 3,
    message: `Spam score: ${spamResult.score}/10 (${spamResult.rating})`,
    severity: spamResult.score <= 3 ? "info" : spamResult.score <= 6 ? "warning" : "error",
  });

  return checks;
}

// ─── Helpers ───────────────────────────────────────────────────────

const SPAM_WORDS = [
  "free", "act now", "limited time", "click here", "buy now",
  "order now", "discount", "cash", "prize", "winner",
  "congratulations", "urgent", "guaranteed", "100%",
  "no obligation", "risk free", "as seen on", "no cost",
  "no credit check", "no hidden costs", "million dollars",
  "earn money", "work from home", "double your", "extra income",
  "make money", "credit card", "mortgage rates",
];

function checkSpamWords(text: string): string[] {
  const lower = text.toLowerCase();
  return SPAM_WORDS.filter((word) => lower.includes(word));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function countUpperCase(text: string): number {
  return (text.match(/[A-Z]/g) ?? []).length;
}
