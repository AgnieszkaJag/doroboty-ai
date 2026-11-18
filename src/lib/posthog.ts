import posthog, { type CaptureResult } from "posthog-js";
import {
  isPublicAnalyticsPathname,
  normalizeAnalyticsPathname,
  PUBLIC_AUTOCAPTURE_URL_ALLOWLIST,
} from "./posthog-paths";

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim();

export const posthogEnabled = import.meta.env.PROD && Boolean(projectToken && apiHost);

function safeCurrentUrl(pathname: string): string {
  const path = normalizeAnalyticsPathname(pathname);
  return `${window.location.origin}${window.location.pathname}#${path}`;
}

function sanitizeEvent(event: CaptureResult): CaptureResult | null {
  const currentPath = normalizeAnalyticsPathname(window.location.hash.slice(1));

  if (event.event === "$autocapture" && !isPublicAnalyticsPathname(currentPath)) return null;

  const properties = { ...event.properties };

  for (const key of Object.keys(properties)) {
    if (/(url|referrer|referring_domain|pathname|search|query)/i.test(key)) {
      delete properties[key];
    }
  }

  properties.$current_url = safeCurrentUrl(currentPath);
  properties.$pathname = currentPath;

  return { ...event, properties };
}

if (posthogEnabled) {
  posthog.init(projectToken!, {
    api_host: apiHost!,
    defaults: "2026-08-30",
    disable_capture_url_hashes: false,
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: {
      dom_event_allowlist: ["click"],
      element_allowlist: ["button"],
      url_allowlist: [PUBLIC_AUTOCAPTURE_URL_ALLOWLIST],
      capture_copied_text: false,
      capture_value_css_selector_allowlist: [],
      css_selector_ignorelist: [".ph-no-autocapture", "[data-ph-no-autocapture]"],
    },
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    mask_personal_data_properties: true,
    person_profiles: "never",
    persistence: "memory",
    respect_dnt: true,
    before_send: sanitizeEvent,
  });
}

export function captureSafePageview(pathname: string): void {
  if (!posthogEnabled) return;

  const safePath = normalizeAnalyticsPathname(pathname);
  posthog.capture("$pageview", {
    $current_url: safeCurrentUrl(safePath),
    $pathname: safePath,
  });
}

export function captureSafeEvent(eventName: string): void {
  if (!posthogEnabled) return;

  const safePath = normalizeAnalyticsPathname(window.location.hash.slice(1));
  posthog.capture(eventName, {
    $current_url: safeCurrentUrl(safePath),
    $pathname: safePath,
  });
}
