// Smoke-Test: Prüft, dass die Test-Infrastruktur (Vitest) grundsätzlich funktioniert.
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
