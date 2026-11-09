import { calendarDateInTimezone } from "@/shared/dates/calendar-date";

export function coupleDisplayName(groomName: string, brideName: string) {
  return [groomName.trim(), brideName.trim()].filter(Boolean).join(" & ");
}

function normalizedDisplayText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function titleMatchesCoupleNames(
  title: string,
  groomName: string,
  brideName: string,
) {
  return (
    normalizedDisplayText(title) ===
    normalizedDisplayText(coupleDisplayName(groomName, brideName))
  );
}

function calendarDateValue(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function weddingCountdown(
  weddingDate: Date,
  timezone: string,
  now = new Date(),
) {
  const weddingCalendarDate = weddingDate.toISOString().slice(0, 10);
  const todayCalendarDate = calendarDateInTimezone(now, timezone);
  const days = Math.round(
    (calendarDateValue(weddingCalendarDate) -
      calendarDateValue(todayCalendarDate)) /
      86_400_000,
  );

  if (days > 1) return `${days} days to go`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Wedding day";
  return "Celebration complete";
}
