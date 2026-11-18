import { describe, expect, it } from "vitest";
import { internalDestination } from "./internal-destination";

describe("internal persona destinations", () => {
  it("preserves an internal path, query and section exactly", () => {
    const path = "/aplikuj/ai-product-manager?projekt=example&tekst=two%20words#answer";
    expect(internalDestination(path)).toBe(path);
    expect(internalDestination("/app/kandydaci/example")).toBe("/app/kandydaci/example");
  });
  it.each([
    undefined,
    null,
    "",
    "https://other.test",
    "//other.test",
    "/\\other.test",
    "/%2fother.test",
    "/%5cother.test",
    "/%0a/other.test",
    "/%00test",
    "/%7ftest",
    "/auth/sign-in?next=/auth/sign-in",
    "/AUTH/sign-in",
    "/%61uth/sign-in",
    "/app/../auth/sign-in",
    "/app/%2e%2e/auth/sign-in",
    "/%broken",
  ])("rejects ambiguous or recursive destinations: %s", (path) => {
    expect(internalDestination(path)).toBeNull();
  });
});
