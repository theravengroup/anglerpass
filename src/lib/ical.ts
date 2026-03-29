/**
 * iCalendar format helper for generating .ics feeds
 */

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: string; // YYYYMMDD format
  dtend: string; // YYYYMMDD format (day after for all-day events)
  location?: string;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  created: string; // ISO 8601
  lastModified: string; // ISO 8601
}

function formatDateUTC(isoDate: string): string {
  return isoDate.replace(/[-:]/g, "").replace(/\.\d+/, "").replace("T", "T");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateICalFeed(
  calendarName: string,
  events: CalendarEvent[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AnglerPass//Calendar Feed//EN",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTART;VALUE=DATE:${event.dtstart}`,
      `DTEND;VALUE=DATE:${event.dtend}`,
      `SUMMARY:${escapeICalText(event.summary)}`,
      `DESCRIPTION:${escapeICalText(event.description)}`,
      `STATUS:${event.status}`,
      `DTSTAMP:${formatDateUTC(new Date().toISOString())}`,
      `CREATED:${formatDateUTC(event.created)}`,
      `LAST-MODIFIED:${formatDateUTC(event.lastModified)}`
    );

    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Convert a booking date string (YYYY-MM-DD) to iCal date format (YYYYMMDD)
 */
export function toICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/**
 * Get the next day in iCal format (for all-day event DTEND)
 */
export function toICalDateEnd(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Map booking status to iCal status
 */
export function toICalStatus(
  bookingStatus: string
): "CONFIRMED" | "TENTATIVE" | "CANCELLED" {
  switch (bookingStatus) {
    case "confirmed":
      return "CONFIRMED";
    case "cancelled":
    case "declined":
      return "CANCELLED";
    default:
      return "TENTATIVE";
  }
}
