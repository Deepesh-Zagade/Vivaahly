import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import OrganizerError from "@/app/(organizer)/error";

describe("organizer error boundary", () => {
  it("renders a recoverable, standalone workspace outage screen", () => {
    const markup = renderToStaticMarkup(
      createElement(OrganizerError, { reset: vi.fn() }),
    );

    expect(markup).toContain("organizer-page");
    expect(markup).toContain("min-h-screen");
    expect(markup).toContain("Your workspace is temporarily unavailable");
    expect(markup).toContain("Your wedding information has not been changed");
    expect(markup).toContain("Try again");
  });
});
