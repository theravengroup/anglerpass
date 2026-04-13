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

/**
 * Generate a single-event .ics file for a booking (for email attachment / download).
 */
export function generateBookingIcs(opts: {
  bookingId: string;
  propertyName: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (last day of booking)
  duration: string; // "full_day" | "half_day"
  partySize: number;
  guideName?: string;
  status?: string;
}): string {
  const dtstart = toICalDate(opts.startDate);
  // For multi-day bookings, DTEND is the day AFTER the last day
  const dtend = toICalDateEnd(opts.endDate ?? opts.startDate);
  const durationLabel = opts.duration === "half_day" ? "Half Day" : "Full Day";

  let description = `${durationLabel} booking for ${opts.partySize} angler${opts.partySize > 1 ? "s" : ""} at ${opts.propertyName}.`;
  if (opts.guideName) {
    description += `\\nGuide: ${opts.guideName}`;
  }
  description += "\\nBooked via AnglerPass";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AnglerPass//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${opts.bookingId}@anglerpass.com`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeICalText(`${opts.propertyName} — ${durationLabel}`)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    `STATUS:${toICalStatus(opts.status ?? "confirmed")}`,
    `DTSTAMP:${formatDateUTC(new Date().toISOString())}`,
  ];

  if (opts.location) {
    lines.push(`LOCATION:${escapeICalText(opts.location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
