type DateTimeParts = {
  date: string;
  time: string;
};

function partsInTimezone(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function dateTimePartsInTimezone(
  value: Date,
  timezone: string,
): DateTimeParts {
  const parts = partsInTimezone(value, timezone);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function zonedDateTimeToIso(
  date: string,
  time: string,
  timezone: string,
) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) return null;

  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  if (
    desired.month < 1 ||
    desired.month > 12 ||
    desired.day < 1 ||
    desired.day > 31 ||
    desired.hour > 23 ||
    desired.minute > 59
  ) {
    return null;
  }

  const localAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = localAsUtc;

  for (let pass = 0; pass < 3; pass += 1) {
    const shown = partsInTimezone(new Date(candidate), timezone);
    const shownAsUtc = Date.UTC(
      Number(shown.year),
      Number(shown.month) - 1,
      Number(shown.day),
      Number(shown.hour),
      Number(shown.minute),
      Number(shown.second),
    );
    candidate -= shownAsUtc - localAsUtc;
  }

  const result = new Date(candidate);
  const roundTrip = dateTimePartsInTimezone(result, timezone);
  if (roundTrip.date !== date || roundTrip.time !== time) return null;
  return result.toISOString();
}

export function formatTimezoneName(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(date);
  const short = parts.find((part) => part.type === "timeZoneName")?.value;
  return short ? `${timezone} (${short})` : timezone;
}
