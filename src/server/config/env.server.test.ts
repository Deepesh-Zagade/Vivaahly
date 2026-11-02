import { describe, expect, it } from "vitest";
import { resolveAppBaseUrl } from "@/server/config/env.server";

describe("application base URL configuration", () => {
  it("uses localhost only outside production", () => {
    expect(
      resolveAppBaseUrl({ nodeEnv: "development", appBaseUrl: undefined }),
    ).toBe("http://localhost:3000");
  });

  it("requires an explicit public HTTPS origin in production", () => {
    expect(() =>
      resolveAppBaseUrl({ nodeEnv: "production", appBaseUrl: undefined }),
    ).toThrow("APP_BASE_URL is required in production.");
    expect(() =>
      resolveAppBaseUrl({
        nodeEnv: "production",
        appBaseUrl: "http://localhost:3000",
      }),
    ).toThrow("public HTTPS application origin");
  });

  it("normalizes a valid production application origin", () => {
    expect(
      resolveAppBaseUrl({
        nodeEnv: "production",
        appBaseUrl: "https://vivaahly.bond/",
      }),
    ).toBe("https://vivaahly.bond");
  });

  it("rejects paths because invitation links require an origin", () => {
    expect(() =>
      resolveAppBaseUrl({
        nodeEnv: "production",
        appBaseUrl: "https://vivaahly.bond/app",
      }),
    ).toThrow("application origin");
  });
});
