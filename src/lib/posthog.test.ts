import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureResult } from "posthog-js";

const sdk = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: sdk }));

beforeEach(() => {
  vi.resetModules();
  sdk.init.mockReset();
  sdk.capture.mockReset();
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-public-token");
  vi.stubEnv("VITE_POSTHOG_HOST", "https://analytics.invalid");
  vi.stubGlobal("window", {
    location: {
      origin: "https://prototype.test",
      pathname: "/private-text",
      hash: "#/app/profil/projekty/private-id?tekst=secret",
    },
    sessionStorage: { getItem: () => null },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("safe browser analytics", () => {
  it("allows only fixed events and safe metadata, even if automatic diagnostics are enabled remotely", async () => {
    const { sanitizeEvent } = await import("./posthog");
    const unsafe = {
      uuid: crypto.randomUUID(),
      event: "application_submitted",
      properties: {
        distinct_id: "anonymous-sdk-id",
        answer: "private-answer",
        project_id: "private-id",
        $current_url: "https://prototype.test/?secret",
        $pathname: "/private/path",
        $referrer: "https://private.test",
        $exception_message: "private error",
        $browser: "Chrome",
        $elements: [{ text: "private text", attr__title: "secret" }],
      },
    } as CaptureResult;
    const result = sanitizeEvent(unsafe)!;
    expect(result.properties).toEqual({
      distinct_id: "anonymous-sdk-id",
      $browser: "Chrome",
      $process_person_profile: false,
      token: "test-public-token",
      $current_url: "https://prototype.test/#/app/profil",
      $pathname: "/app/profil",
    });
    expect(JSON.stringify(result)).not.toMatch(/private|secret/);
    expect(sanitizeEvent({ ...unsafe, event: "$exception" })).toBeNull();
    expect(sanitizeEvent({ ...unsafe, event: "$autocapture" })).toBeNull();
    expect(
      sanitizeEvent({
        ...unsafe,
        event: "prototype_error",
        properties: { error_code: "storage_write", message: "secret" },
      })?.properties.error_code,
    ).toBe("storage_write");
  });
  it.each(["button", "a"])(
    "keeps only the public clicked %s tag and no DOM contents",
    async (tag) => {
      window.location.hash = "#/oferty?query=private";
      const { sanitizeEvent } = await import("./posthog");
      const result = sanitizeEvent({
        uuid: crypto.randomUUID(),
        event: "$autocapture",
        properties: {
          $elements: [
            { tag_name: "svg", text: "secret" },
            { tag_name: tag, attr__id: "private", attr__href: "#/oferty/private?query=secret" },
          ],
          $event_type: "click",
          email: "private",
        },
      } as CaptureResult)!;
      expect(result.properties.$elements).toEqual([{ tag_name: tag }]);
      expect(result.properties.$event_type).toBe("click");
      expect(JSON.stringify(result)).not.toMatch(/private|secret|email/);
    },
  );
  it("rejects non-click interactions and form-only element chains", async () => {
    window.location.hash = "#/oferty";
    const { sanitizeEvent } = await import("./posthog");
    const event = {
      uuid: crypto.randomUUID(),
      event: "$autocapture",
      properties: { $event_type: "change", $elements: [{ tag_name: "button" }] },
    } as CaptureResult;
    expect(sanitizeEvent(event)).toBeNull();
    expect(
      sanitizeEvent({
        ...event,
        properties: { $event_type: "click", $elements: [{ tag_name: "input", value: "secret" }] },
      }),
    ).toBeNull();
  });
  it("does not let SDK init or capture failures escape into application work", async () => {
    sdk.capture.mockImplementation(() => {
      throw new Error("unavailable");
    });
    const analytics = await import("./posthog");
    expect(() => analytics.captureSafeEvent("project_card_add_clicked")).not.toThrow();
    expect(sdk.init.mock.calls[0][1]).toMatchObject({
      disable_session_recording: true,
      disable_external_dependency_loading: true,
      capture_exceptions: false,
      capture_performance: false,
      disable_surveys: true,
      persistence: "memory",
      person_profiles: "never",
      respect_dnt: true,
    });
    vi.resetModules();
    sdk.init.mockImplementation(() => {
      throw new Error("invalid SDK config");
    });
    const broken = await import("./posthog");
    expect(() => broken.captureSafePageview("/app/profil")).not.toThrow();
  });
  it("keeps unconfigured and development builds offline", async () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "");
    const analytics = await import("./posthog");
    analytics.captureSafeEvent("application_submitted");
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
    vi.resetModules();
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-public-token");
    const dev = await import("./posthog");
    dev.captureSafeEvent("application_submitted");
    expect(sdk.init).not.toHaveBeenCalled();
  });
});
