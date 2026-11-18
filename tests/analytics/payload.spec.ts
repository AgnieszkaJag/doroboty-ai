import { test, expect } from "./fixtures";
import { gunzipSync } from "node:zlib";

for (const elementsChainAsString of [false, true]) {
  test(`the real SDK emits sanitized events with the public ingestion token (serialized chain: ${elementsChainAsString})`, async ({
    page,
    context,
  }) => {
    const events: { event: string; properties: Record<string, unknown> }[] = [];
    const decodeFailures: string[] = [];
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === "http://127.0.0.1:3107") return route.continue();
      if (url.hostname === "analytics.invalid" && url.pathname.endsWith("/config.js"))
        return route.fulfill({ status: 404, body: "" });
      if (url.hostname === "analytics.invalid" && /\/(?:config|flags\/?)$/.test(url.pathname))
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            featureFlags: {},
            featureFlagPayloads: {},
            autocapture_opt_out: false,
            elementsChainAsString,
          }),
        });
      if (url.hostname === "analytics.invalid" && /\/(?:e|batch)\/?$/.test(url.pathname)) {
        try {
          let body = request.postDataBuffer()!;
          if (body[0] === 0x1f && body[1] === 0x8b) body = gunzipSync(body);
          let text = body.toString("utf8");
          const formData = new URLSearchParams(text).get("data");
          if (formData) text = Buffer.from(formData, "base64").toString("utf8");
          const parsed = JSON.parse(text);
          events.push(...(Array.isArray(parsed) ? parsed : (parsed.batch ?? [parsed])));
        } catch {
          decodeFailures.push(
            `${request.method()} ${url.pathname}: ${request.postDataBuffer()?.subarray(0, 8).toString("hex")}`,
          );
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: '{"status":1}',
        });
      }
      return route.abort("failed");
    });
    await page.goto("/#/oferty?context=synthetic-private-marker");
    await expect.poll(() => events.some((event) => event.event === "$pageview")).toBe(true);
    await page.getByRole("button", { name: "Szukaj", exact: true }).click();
    const roleLink = page.getByRole("link", { name: "AI Product Manager", exact: true });
    await roleLink.focus();
    await roleLink.press("Enter");
    await expect(page).toHaveURL(/#\/oferty\/ai-product-manager$/);
    await page.getByRole("link", { name: "O roli", exact: true }).click();
    await page.getByRole("link", { name: "O firmie", exact: true }).click();
    await expect
      .poll(() => events.filter((event) => event.event === "$autocapture").length)
      .toBe(4);
    await page.getByRole("link", { name: "Wybierz osobę i aplikuj", exact: true }).click();
    await page.goto("/#/testy");
    await page.getByRole("button", { name: "Rozpocznij test", exact: true }).click();
    await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
    await page.goto("/#/oferty/ai-product-manager");
    await page.getByRole("link", { name: "Aplikuj", exact: true }).click();
    await page.goto("/#/aplikuj/ai-product-manager?query=synthetic-private-marker");
    await page
      .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
      .fill("synthetic-private-marker in an answer that must not leave this page");
    await page.getByRole("button", { name: "Dodaj nowy projekt", exact: true }).click();
    await page.evaluate(() =>
      window.dispatchEvent(new ErrorEvent("error", { message: "synthetic-private-marker" })),
    );
    await expect
      .poll(
        () => ({
          names: events.map((event) => event.event),
          applicationStarts: events.filter((event) => event.event === "application_start_clicked")
            .length,
          decodeFailures,
        }),
        {
          timeout: 10000,
        },
      )
      .toMatchObject({
        names: expect.arrayContaining(["project_card_add_clicked", "prototype_error"]),
        applicationStarts: 2,
        decodeFailures: [],
      });
    expect(decodeFailures).toEqual([]);
    expect(events.length).toBeGreaterThan(0);
    const clicks = events.filter((event) => event.event === "$autocapture");
    expect(clicks.length).toBeGreaterThanOrEqual(4);
    expect(
      clicks.every((event) =>
        ["/oferty", "/oferty/:slug", "/testy"].includes(String(event.properties.$pathname)),
      ),
    ).toBe(true);
    expect(clicks.map((event) => event.properties.$elements)).toContainEqual([
      { tag_name: "button" },
    ]);
    expect(clicks.map((event) => event.properties.$elements)).toContainEqual([{ tag_name: "a" }]);
    for (const event of events.filter((event) => event.event === "application_start_clicked"))
      expect(event.properties.$pathname).toBe("/oferty/:slug");
    for (const event of events) {
      expect(event.properties.token).toBe("phc_synthetic_offline_verification_only");
      expect(event.properties.distinct_id).toBeTruthy();
      expect(event.properties.$process_person_profile).toBe(false);
      expect(JSON.stringify(event)).not.toMatch(
        /synthetic-private-marker|candidate-anna|Anna Kowalska/,
      );
    }
    const creation = events.find((event) => event.event === "project_card_add_clicked")!;
    expect(creation.properties.research_run_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(creation.properties.$pathname).toBe("/aplikuj/:slug");
    expect(events.find((event) => event.event === "prototype_error")?.properties.error_code).toBe(
      "uncaught",
    );
  });
}
