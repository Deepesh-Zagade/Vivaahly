import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/server/security/same-origin";

describe("assertSameOrigin", () => {
  it("accepts a matching browser origin", () => {
    const request = new Request("https://vivaahly.example/api/v1/auth/logout", {
      headers: { origin: "https://vivaahly.example" },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects a cross-origin browser request", () => {
    const request = new Request("https://vivaahly.example/api/v1/auth/logout", {
      headers: { origin: "https://attacker.example" },
    });

    expect(() => assertSameOrigin(request)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN", status: 403 }),
    );
  });
});
