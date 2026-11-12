import { dateTimePartsInTimezone } from "@/shared/dates/zoned-date-time";

export function eventCalendarDate(date: Date, timezone: string) {
  return dateTimePartsInTimezone(date, timezone).date;
}

export function formatEventDay(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatEventTimeRange(
  startAt: Date,
  endAt: Date,
  timezone: string,
) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
  const startDay = eventCalendarDate(startAt, timezone);
  const endDay = eventCalendarDate(endAt, timezone);
  const suffix =
    new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      timeZoneName: "short",
    })
      .formatToParts(startAt)
      .find((part) => part.type === "timeZoneName")?.value ?? timezone;
  if (startDay === endDay) {
    return `${formatter.format(startAt)} – ${formatter.format(endAt)} ${suffix}`;
  }
  const endDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
  }).format(endAt);
  return `${formatter.format(startAt)} – ${endDate}, ${formatter.format(endAt)} ${suffix}`;
}
