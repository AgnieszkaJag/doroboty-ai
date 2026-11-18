import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { RESEARCH_SESSION_KEY } from "../../src/lib/research-session";

async function expectPanelContentsToFit(page: Page) {
  const overflow = await page.locator(".prototype-form").evaluateAll((panels) =>
    panels.flatMap((panel) => {
      const bounds = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const left = bounds.left + parseFloat(style.paddingLeft);
      const right = bounds.right - parseFloat(style.paddingRight);
      return Array.from(panel.querySelectorAll("p, h1, h2, button, .research-action")).flatMap(
        (element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < left - 1 || rect.right > right + 1
            ? [
                {
                  tag: element.tagName,
                  left: rect.left,
                  right: rect.right,
                  allowedLeft: left,
                  allowedRight: right,
                },
              ]
            : [];
        },
      );
    }),
  );
  expect(overflow).toEqual([]);
}

test("fresh protected candidate and employer links retain their full destination", async ({
  page,
}) => {
  await page.goto("/#/aplikuj/ai-product-manager?projekt=missing-card");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await expect(page).toHaveURL(/#\/aplikuj\/ai-product-manager\?projekt=missing-card$/);
  await expect(page.getByRole("heading", { name: "Aplikuj na ofertę", exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.goto("/#/app/kandydaci/application-example");
  await page.reload();
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await expect(page).toHaveURL(/#\/app\/kandydaci\/application-example$/);
  await expect(page.getByRole("heading", { name: "Marek Nowak", exact: true })).toBeVisible();
});

test("answer edits, short drafts and clearing persist without approving submission", async ({
  page,
}) => {
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  const answer = page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true });
  const consent = page.getByRole("checkbox", {
    name: /^Zatwierdzam treść i przesłanie aplikacji/,
  });
  await answer.fill("Robocze");
  await page.getByRole("link", { name: "Wróć do oferty", exact: true }).click();
  await page.getByRole("link", { name: "Aplikuj", exact: true }).first().click();
  await expect(answer).toHaveValue("Robocze");
  await answer.fill("Syntetyczna odpowiedź z moim wkładem i wynikiem projektu.");
  await consent.check();
  await answer.press("End");
  await answer.press("!");
  await expect(consent).not.toBeChecked();
  await page.reload();
  await expect(answer).toHaveValue("Syntetyczna odpowiedź z moim wkładem i wynikiem projektu.!");
  await expect(consent).not.toBeChecked();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(consent).toBeFocused();
  await answer.fill("");
  await page.reload();
  await expect(answer).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Aplikuj na ofertę", exact: true })).toBeVisible();
});

test("failed storage retains an exportable draft, warns on leaving and prevents false submission", async ({
  page,
}) => {
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Test quota", "QuotaExceededError");
    };
  });
  const text = "Najnowsza fikcyjna odpowiedź, którą trzeba zachować przy awarii zapisu.";
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(text);
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Nie zapisano aplikacji" })).toBeVisible();
  await expect(page).toHaveURL(/#\/aplikuj\//);
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(true);
  await page.getByRole("link", { name: "Ustawienia danych", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  const file = await downloaded;
  const scenario = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(scenario.drafts[0].answer).toBe(text);
  expect(scenario.applications).toHaveLength(1);
});

test("unmoderated instructions, keyboard entry and safe run summary survive reload", async ({
  page,
}) => {
  await page.goto("/#/testy");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expectPanelContentsToFit(page);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
    ).toEqual([]);
    await page.screenshot({ path: `artifacts/test-guide-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Rozpocznij test", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await expect(page).toHaveURL(/#\/oferty$/);
  const run = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    RESEARCH_SESSION_KEY,
  );
  await page.goto("/#/testy?etap=koniec");
  await page.reload();
  await expect(page.getByText(run.code, { exact: true })).toBeVisible();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expectPanelContentsToFit(page);
    await page.screenshot({ path: `artifacts/test-feedback-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Zatrzymał mnie problem", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Zapisano zakończenie próby");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz podsumowanie próby", exact: true }).click();
  const summary = await readFile((await (await downloaded).path())!, "utf8");
  expect(summary).toContain(run.code);
  expect(summary).toContain("Zakończenie: problem");
  expect(summary).not.toMatch(/Anna|Kowalska|candidateId|notes|answer|companyId/);
  await page.getByRole("link", { name: "Przejdź bez kodu próby", exact: true }).click();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), RESEARCH_SESSION_KEY),
  ).toBeNull();
});

test("privacy distinguishes research-link deletion from provider retention and local reset", async ({
  page,
}) => {
  await page.goto("/#/testy");
  await page.getByRole("link", { name: "Informacja o danych", exact: true }).click();
  await expect(page).toHaveURL(/#\/polityka-prywatnosci$/);
  const main = page.getByRole("main");
  await expect(main).toContainText("do 30 dni po ostatnim teście");
  await expect(main).toContainText("12 miesięcy");
  await expect(main).toContainText("według swojego harmonogramu");
  await expect(main).toContainText("obecnie tylko właściciel badania");
  await expect(main).toContainText("nie usuwa zdarzeń z PostHog ani przesłanych opinii");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    const overflow = await main.locator("p, h1").evaluateAll(
      (elements) =>
        elements.filter((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left < 0 || bounds.right > innerWidth;
        }).length,
    );
    expect(overflow).toBe(0);
    await page.screenshot({ path: `artifacts/privacy-retention-${width}.png`, fullPage: true });
  }
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(
    scan.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
  ).toEqual([]);
});

test("a render failure offers focused recovery without exposing raw error text", async ({
  page,
}) => {
  await page.goto("/#/app/settings");
  await expect(
    page.getByRole("heading", { name: "Ustawienia prototypu", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(Intl, "DateTimeFormat", {
      configurable: true,
      value: function () {
        throw new Error("Synthetic private render details");
      },
    });
  });
  await page.getByRole("link", { name: "Oferty", exact: true }).first().click();
  await expect(
    page.getByRole("heading", { name: "Nie udało się wyświetlić tego widoku", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("Synthetic private render details", { exact: false })).toHaveCount(0);
  await page.screenshot({ path: "artifacts/recovery-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/recovery-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await expectPanelContentsToFit(page);
  await page.getByRole("link", { name: "Otwórz ustawienia danych", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ustawienia prototypu", exact: true }),
  ).toBeVisible();
});

test("company facts are accessible and candidate save actions persist", async ({ page }) => {
  await page.goto("/#/auth/sign-in?audience=candidate&next=/firmy/northstar-health");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Northstar Health", exact: true })).toBeVisible();
  const save = page.getByRole("button", { name: /^Zapisz ofertę:/ }).first();
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
    ).toEqual([]);
    await page.screenshot({ path: `artifacts/company-readiness-${width}.png`, fullPage: true });
  }
});
