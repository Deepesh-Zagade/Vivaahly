import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardContent } from "@/app/(organizer)/app/_components/dashboard-content";

describe("dashboard ceremony timeline", () => {
  it("groups ceremony days, removes timezone suffixes, and limits the preview", () => {
    const events = [
      timelineEvent("event-1", "Morning ceremony", "Thursday, 12 November 2026", "10:00 am – 11:00 am IST", true),
      timelineEvent("event-2", "Family lunch", "Thursday, 12 November 2026", "11:00 am – 12:00 pm IST"),
      timelineEvent("event-3", "Mehendi", "Friday, 13 November 2026", "2:00 pm – 4:00 pm IST"),
      timelineEvent("event-4", "Sangeet", "Saturday, 14 November 2026", "6:00 pm – 10:00 pm IST"),
      timelineEvent("event-5", "Wedding", "Sunday, 15 November 2026", "10:00 am – 1:00 pm IST"),
      timelineEvent("event-6", "Reception", "Sunday, 15 November 2026", "7:00 pm – 10:00 pm IST"),
    ];

    const markup = renderToStaticMarkup(
      createElement(DashboardContent, {
        organizerName: "Deepesh",
        showDemoData: false,
        events,
        members: [],
      }),
    );

    expect(markup).toContain("2 ceremonies");
    expect(markup).toContain("11:00 am – 12:00 pm");
    expect(markup).not.toContain("11:00 am – 12:00 pm IST");
    expect(markup).toContain("View all 6 events");
    expect(markup).not.toContain("Reception");
    expect(markup).toContain("color:#702b45");
    expect(markup).toContain("color:#a64f3b");
  });
});

function timelineEvent(
  id: string,
  title: string,
  dayLabel: string,
  timeLabel: string,
  upcoming = false,
) {
  return {
    id,
    title,
    dayLabel,
    timeLabel,
    location: "Celebration venue",
    upcoming,
  };
}
