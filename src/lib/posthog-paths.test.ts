import { describe, expect, it } from "vitest";
import {
  isPublicAnalyticsPathname,
  normalizeAnalyticsPathname,
  PUBLIC_AUTOCAPTURE_URL_ALLOWLIST,
} from "./posthog-paths";

describe("PostHog route privacy", () => {
  it("normalizes slugs, IDs, and search text to stable route categories", () => {
    expect(normalizeAnalyticsPathname("/oferty?query=prywatne%20dane")).toBe("/oferty");
    expect(normalizeAnalyticsPathname("/oferty/ai-product-manager")).toBe("/oferty/:slug");
    expect(normalizeAnalyticsPathname("/firmy/example-company")).toBe("/firmy/:slug");
    expect(normalizeAnalyticsPathname("/app/aplikacje/12345678-1234-1234-1234-123456789012")).toBe(
      "/app/aplikacje",
    );
  });

  it("allows autocapture on public routes only", () => {
    expect(isPublicAnalyticsPathname("/")).toBe(true);
    expect(isPublicAnalyticsPathname("/testy?etap=koniec")).toBe(true);
    expect(isPublicAnalyticsPathname("/oferty/ai-product-manager")).toBe(true);
    expect(isPublicAnalyticsPathname("/app/profil/projekty/secret-id")).toBe(false);
    expect(isPublicAnalyticsPathname("/aplikuj/ai-product-manager")).toBe(false);
    expect(isPublicAnalyticsPathname("/not-found/private-text")).toBe(false);
    expect(isPublicAnalyticsPathname("/app/ustawienia?search=private-text")).toBe(false);
  });

  it("matches public hash routes regardless of deployment host or search query", () => {
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/")).toBe(true);
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/?campaign=public")).toBe(
      true,
    );
    expect(
      PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/oferty?query=hidden"),
    ).toBe(true);
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/metodologia")).toBe(true);
    expect(
      PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/oferty/role#employer"),
    ).toBe(true);
    expect(
      PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/oferty/role?query=hidden#role"),
    ).toBe(true);
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/testy?etap=koniec")).toBe(
      true,
    );
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/app/profil")).toBe(false);
    expect(
      PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/app/profil#employer"),
    ).toBe(false);
    expect(PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/aplikuj/role")).toBe(
      false,
    );
    expect(
      PUBLIC_AUTOCAPTURE_URL_ALLOWLIST.test("https://example.test/#/unknown/private-text"),
    ).toBe(false);
  });
});
