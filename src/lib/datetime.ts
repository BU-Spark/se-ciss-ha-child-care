/** Massachusetts EEC wall-clock timezone for session scheduling and display. */
export const APP_TIME_ZONE = "America/New_York";

/** Format a calendar date in America/New_York (e.g. "June 21, 2026"). */
export function formatAppDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(typeof value === "string" ? new Date(value) : value);
}

/** Format a time in America/New_York (e.g. "10:00 AM"). */
export function formatAppTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatAppTimeRange(startsAt: string | Date, endsAt: string | Date) {
  return `${formatAppTime(startsAt)} – ${formatAppTime(endsAt)}`;
}

export function formatAppShortDate(value: string | Date) {
  return formatAppDate(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Convert a date + HH:mm wall-clock time in America/New_York to a UTC ISO string.
 * Avoids browser-local timezone shifting session start/end times.
 */
export function etWallTimeToIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    [year, month, day, hour, minute].some(
      (part) => !Number.isFinite(part),
    )
  ) {
    return null;
  }

  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, APP_TIME_ZONE);
  utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60_000;

  // Re-check once in case of DST boundary shifts.
  const adjustedOffset = getTimeZoneOffsetMinutes(utcGuess, APP_TIME_ZONE);
  if (adjustedOffset !== offsetMinutes) {
    utcGuess =
      Date.UTC(year, month - 1, day, hour, minute, 0) - adjustedOffset * 60_000;
  }

  return new Date(utcGuess).toISOString();
}

function getTimeZoneOffsetMinutes(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));

  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = raw.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const sign = hours < 0 || Object.is(hours, -0) ? -1 : 1;
  return sign * (Math.abs(hours) * 60 + minutes);
}

/** YYYY-MM-DD for "today" in America/New_York. */
export function appTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Add days to a YYYY-MM-DD string and return YYYY-MM-DD. */
export function addDaysToDateString(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}
