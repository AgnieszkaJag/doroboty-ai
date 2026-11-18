import posthog, { type CaptureResult } from "posthog-js";
import {
  isPublicAnalyticsPathname,
  normalizeAnalyticsPathname,
  PUBLIC_AUTOCAPTURE_URL_ALLOWLIST,
} from "./posthog-paths";
import { readResearchRun } from "./research-session";

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim();
export const posthogEnabled = import.meta.env.PROD && Boolean(projectToken && apiHost);
const eventNames = [
  "application_start_clicked",
  "project_card_add_clicked",
  "project_card_confirmed",
  "application_submitted",
  "research_test_started",
  "research_test_completed",
  "research_test_blocked",
  "prototype_error",
] as const;
export type SafeEventName = (typeof eventNames)[number];
const errorCodes = [
  "storage_read",
  "storage_write",
  "storage_conflict",
  "invalid_action",
  "render",
  "uncaught",
  "unhandled_rejection",
] as const;
type ErrorCode = (typeof errorCodes)[number];
let ready = false;

function safeCurrentUrl(pathname: string): string {
  // The deployment path itself can contain user-controlled text on a static host.
  return `${window.location.origin}/#${normalizeAnalyticsPathname(pathname)}`;
}

/** A strict payload allowlist also protects against remotely enabled SDK features. */
export function sanitizeEvent(event: CaptureResult): CaptureResult | null {
  const currentPath = normalizeAnalyticsPathname(window.location.hash.slice(1));
  if (!["$pageview", "$autocapture", ...eventNames].includes(event.event)) return null;
  let clickTag: "a" | "button" | undefined;
  if (event.event === "$autocapture") {
    if (!isPublicAnalyticsPathname(currentPath) || event.properties.$event_type !== "click")
      return null;
    const elements = event.properties.$elements;
    const tag = Array.isArray(elements)
      ? elements.find((element) => element?.tag_name === "a" || element?.tag_name === "button")
          ?.tag_name
      : undefined;
    if (tag !== "a" && tag !== "button") return null;
    clickTag = tag;
  }

  const properties: CaptureResult["properties"] = {};
  for (const key of [
    "distinct_id",
    "$device_id",
    "$session_id",
    "$window_id",
    "$lib",
    "$lib_version",
    "$browser",
    "$browser_version",
    "$os",
    "$os_version",
    "$device_type",
    "$screen_width",
    "$screen_height",
    "$viewport_width",
    "$viewport_height",
  ]) {
    const value = event.properties[key];
    if (typeof value === "string" || typeof value === "number") properties[key] = value;
  }
  properties.$process_person_profile = false;
  // PostHog's event endpoint authenticates with this public ingestion token.
  if (projectToken) properties.token = projectToken;
  properties.$current_url = safeCurrentUrl(currentPath);
  properties.$pathname = currentPath;
  if (event.event === "$autocapture") {
    properties.$event_type = "click";
    // No text, CSS classes, element IDs, hrefs or other DOM attributes leave the page.
    properties.$elements = [{ tag_name: clickTag }];
  }
  const run = readResearchRun();
  if (run) properties.research_run_id = run.code;
  if (event.event === "prototype_error" && errorCodes.includes(event.properties.error_code))
    properties.error_code = event.properties.error_code;
  return { ...event, properties };
}

if (posthogEnabled) {
  try {
    posthog.init(projectToken!, {
      api_host: apiHost!,
      defaults: "2026-08-30",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: {
        dom_event_allowlist: ["click"],
        element_allowlist: ["button", "a"],
        url_allowlist: [PUBLIC_AUTOCAPTURE_URL_ALLOWLIST],
        capture_copied_text: false,
        capture_value_css_selector_allowlist: [],
        css_selector_ignorelist: [".ph-no-autocapture", "[data-ph-no-autocapture]"],
      },
      disable_session_recording: true,
      disable_external_dependency_loading: true,
      capture_exceptions: false,
      capture_performance: false,
      disable_surveys: true,
      enable_heatmaps: false,
      mask_all_text: true,
      mask_all_element_attributes: true,
      mask_personal_data_properties: true,
      person_profiles: "never",
      persistence: "memory",
      respect_dnt: true,
      before_send: sanitizeEvent,
    });
    ready = true;
  } catch {
    // Optional telemetry must never break boot or scenario work.
  }
}

function capture(eventName: SafeEventName | "$pageview", properties: Record<string, string>) {
  if (!ready) return;
  try {
    posthog.capture(eventName, properties);
  } catch {
    // SDK/network failures are independent of the local operation being observed.
  }
}

export function captureSafePageview(pathname: string): void {
  if (!ready) return;
  const safePath = normalizeAnalyticsPathname(pathname);
  capture("$pageview", { $current_url: safeCurrentUrl(safePath), $pathname: safePath });
}

export function captureSafeEvent(eventName: SafeEventName, errorCode?: ErrorCode): void {
  capture(eventName, errorCode ? { error_code: errorCode } : {});
}
