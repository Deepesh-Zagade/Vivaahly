import { describe, expect, it } from "vitest";
import { conflictError, validationError } from "./errors";

describe("application error conventions", () => {
  it("uses 400 for validation and domain-input failures", () => {
    const error = validationError();

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
  });

  it("reserves 409 for conflicts", () => {
    const error = conflictError("The requested state conflicts with the current state.");

    expect(error.code).toBe("CONFLICT");
    expect(error.status).toBe(409);
  });
});
