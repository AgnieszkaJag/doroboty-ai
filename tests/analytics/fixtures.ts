import { test as base, expect } from "@playwright/test";

// Match a human browser for SDK telemetry only. All analytics traffic stays intercepted.
// https://posthog.com/docs/product-analytics/troubleshooting#automated-browsers-are-filtered
export const test = base.extend({
  context: async ({ context }, runTest) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      const brands = [
        { brand: "Chromium", version: "153" },
        { brand: "Google Chrome", version: "153" },
      ];
      const data = { brands, mobile: false, platform: "Windows" };
      Object.defineProperty(navigator, "userAgentData", {
        get: () => ({
          ...data,
          toJSON: () => data,
          getHighEntropyValues: async () => ({ ...data, fullVersionList: brands }),
        }),
      });
    });
    await runTest(context);
  },
});
export { expect };
