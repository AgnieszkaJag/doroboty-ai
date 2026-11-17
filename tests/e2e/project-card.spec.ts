import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function choose(page: Page, name = "Anna Kowalska") {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }).click();
}
async function create(page: Page) {
  await choose(page);
  await page.goto("/#/app/profil");
  await page.getByRole("button", { name: "Dodaj projekt", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Twój projekt. Twój wkład.", exact: true }),
  ).toBeVisible();
}
const own =
  "Samodzielnie przeprowadziłam 8 wywiadów i zaprojektowałam prototyp. Odpowiadałam za testy. Wybrałam ręczne zatwierdzanie, ponieważ model mógł się pomylić.";
const team = "Engineering zbudował model i integrację. Product manager ustalił zakres pilotażu.";
async function fill(page: Page, incomplete = false) {
  await page.getByLabel("Nazwa projektu", { exact: true }).fill("Asystent obsługi zgłoszeń");
  await page
    .getByLabel("Kontekst i Twoja rola", { exact: true })
    .fill(
      "Zespół obsługi klienta ręcznie przypisywał zgłoszenia. Jako product designer zaprojektowałam pilotaż dla 12 konsultantów.",
    );
  await page
    .getByLabel("Moja praca i odpowiedzialność", { exact: true })
    .fill(incomplete ? "Pracowaliśmy razem nad projektem." : own);
  await page
    .getByLabel("Praca pozostałych osób", { exact: true })
    .fill(incomplete ? "Wspólnie." : team);
  await page
    .getByLabel("Rezultat i jego podstawa", { exact: true })
    .fill(
      "W testach 9 z 12 konsultantów ukończyło zadanie bez pomocy. Wynik pochodzi z arkusza obserwacji mojego prototypu.",
    );
}

test("project form, direct AI report, confirmation, reuse and immutable recruiter materials", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await create(page);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toBeFocused();
  await fill(page, true);
  const projectUrl = page.url();
  await page.reload();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Asystent obsługi zgłoszeń",
  );
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Co wynika z opisu?", exact: true }),
  ).toBeVisible();
  await expect(page.locator('textarea[id^="followup-"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Zobacz całą kartę", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Twoja Karta Projektu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Popraw opis", exact: true }).click();
  await page.getByLabel("Moja praca i odpowiedzialność", { exact: true }).fill(own);
  await page.getByLabel("Praca pozostałych osób", { exact: true }).fill(team);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await expect(page.locator(".project-preview").getByText(own, { exact: true })).toBeVisible();
  await expect(page.locator(".project-preview").getByText(team, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Twoja Karta Projektu", exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.getByText("Karta potwierdzona i zapisana na profilu.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".project-analysis")).toHaveCount(0);
  await page.getByRole("button", { name: "Dołącz do rekrutacji", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Wybierz ofertę dla karty projektu", exact: true })
    .click();
  await page.getByRole("option", { name: "AI Product Manager", exact: true }).click();
  await page.getByRole("link", { name: "Dołącz do rekrutacji", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent obsługi zgłoszeń/ }),
  ).toBeChecked();
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill("Mam doświadczenie w badaniach, prototypowaniu i pracy z zespołem przy narzędziach AI.");
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  const applicationUrl = page.url();
  await page.getByRole("tab", { name: "Karta Projektu", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Karta Projektu", exact: true })
      .getByText(own, { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("tabpanel", { name: "Karta Projektu", exact: true })
      .locator(".project-analysis"),
  ).toHaveCount(0);
  await page.goto(projectUrl);
  await page.getByRole("button", { name: "Popraw opis", exact: true }).click();
  await page
    .getByLabel("Moja praca i odpowiedzialność", { exact: true })
    .fill("Zmieniony opis własnej pracy po wysłaniu aplikacji.");
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Twoja Karta Projektu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await expect(page.locator(".project-analysis")).toHaveCount(0);
  await page.getByRole("button", { name: "Dołącz do rekrutacji", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Wybierz ofertę dla karty projektu", exact: true })
    .click();
  await page.getByRole("option", { name: "AI Operations Specialist", exact: true }).click();
  await page.getByRole("link", { name: "Dołącz do rekrutacji", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent obsługi zgłoszeń/ }),
  ).toBeChecked();
  await choose(page, "Karolina Wiśniewska");
  await page.goto(applicationUrl.replace("/app/aplikacje/", "/app/kandydaci/"));
  await page.getByRole("tab", { name: "Karta Projektu", exact: true }).click();
  const recruiterProject = page.getByRole("tabpanel", { name: "Karta Projektu", exact: true });
  await expect(
    recruiterProject.getByRole("heading", { name: "Co ten projekt wnosi do roli?", exact: true }),
  ).toBeVisible();
  await expect(recruiterProject.locator(".project-preview")).not.toBeVisible();
  await recruiterProject
    .getByText("Przeczytaj potwierdzoną kartę projektu", { exact: true })
    .click();
  await expect(
    recruiterProject.locator(".project-preview").getByText(own, { exact: true }),
  ).toBeVisible();
  await expect(recruiterProject.locator(".project-analysis")).toHaveCount(0);
  await expect(
    page.getByText("Zmieniony opis własnej pracy po wysłaniu aplikacji.", { exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 850 });
  const tabs = page.getByRole("tablist");
  expect(await tabs.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(page.getByRole("tab", { name: "Karta Projektu", exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/project-card-recruiter-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("single card fits phone, tablet and desktop and grows with long text", async ({ page }) => {
  await create(page);
  await fill(page);
  for (const width of [320, 390, 768, 1004, 1006, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    const geometry = await page.locator(".project-sheet").evaluate((element) => {
      const sheet = getComputedStyle(element);
      const row = element.querySelector(".project-contributions")!;
      const fields = Array.from(row.children).map((field) => field.getBoundingClientRect());
      return {
        content:
          element.clientWidth - parseFloat(sheet.paddingLeft) - parseFloat(sheet.paddingRight),
        sideBySide: Math.abs(fields[0].top - fields[1].top) < 2,
        overflow: document.documentElement.scrollWidth > innerWidth,
        inputSize: getComputedStyle(element.querySelector("textarea")!).fontSize,
        buttonHeights: Array.from(element.querySelectorAll("button")).map(
          (button) => button.getBoundingClientRect().height,
        ),
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(parseFloat(geometry.inputSize)).toBeGreaterThanOrEqual(16);
    expect(geometry.buttonHeights.every((height) => height >= 44)).toBe(true);
    expect(geometry.sideBySide).toBe(geometry.content >= 640);
    if (width === 390 || width === 1280)
      await page.screenshot({ path: `artifacts/project-card-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const long = "Samodzielnie zaprojektowałam i przetestowałam przepływ. ".repeat(50);
  await page.getByLabel("Moja praca i odpowiedzialność", { exact: true }).fill(long);
  const textarea = page.getByLabel("Moja praca i odpowiedzialność", { exact: true });
  expect(
    await textarea.evaluate((element) => element.scrollHeight <= element.clientHeight + 2),
  ).toBe(true);
  const result = await new AxeBuilder({ page }).include(".project-page").analyze();
  expect(result.violations).toEqual([]);
});

test("application answer survives creating and attaching a project", async ({ page }) => {
  await choose(page);
  await page.goto("/#/aplikuj/ai-product-manager");
  const answer = "Mój opis doświadczenia pozostaje w szkicu aplikacji podczas tworzenia karty.";
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(answer);
  await page.getByRole("button", { name: "Dodaj nowy projekt", exact: true }).click();
  await fill(page);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await page.getByRole("link", { name: "Wróć i dołącz kartę", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(answer);
  await expect(
    page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent obsługi zgłoszeń/ }),
  ).toBeChecked();
});

test("profile surfaces align and a saved draft leads to recruitment attachment", async ({
  page,
}) => {
  await choose(page);
  await page.goto("/#/app/profil");
  await expect(page.getByText("Za doświadczeniem stoi konkretna praca.")).toHaveCount(0);
  await expect(page.getByText(/Dodaj pierwszy projekt\. Trzy pytania/)).toHaveCount(0);
  await expect(page.locator(".main-content h2")).toHaveText(["CV", "Moje projekty"]);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const surfaces = await page
      .locator(".main-content .prototype-panel, .project-profile-section")
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
    expect(surfaces).toHaveLength(3);
    expect(Math.max(...surfaces) - Math.min(...surfaces)).toBeLessThan(2);
  }
  await page.getByRole("button", { name: "Dodaj projekt", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nazwa projektu", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Jaki problem rozwiązywał projekt?" }),
  ).toHaveCount(0);
  await fill(page);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  const next = page.getByRole("region", { name: "Dołącz projekt do rekrutacji", exact: true });
  await expect(next).toBeVisible();
  const review = next.getByRole("button", { name: "Sprawdź i dołącz do rekrutacji", exact: true });
  await expect(review).toBeDisabled();
  await next.getByRole("combobox").click();
  await page.getByRole("option", { name: "AI Product Manager", exact: true }).click();
  await expect(review).toHaveCSS("background-color", "rgb(227, 77, 184)");
  await review.click();
  await expect(
    page.getByRole("heading", { name: "Co wynika z opisu?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await expect(page.locator(".project-analysis")).toHaveCount(0);
  const directAttach = page.getByRole("link", { name: "Wróć i dołącz kartę", exact: true });
  const attachPosition = await directAttach.boundingBox();
  const cardPosition = await page.locator(".project-sheet").boundingBox();
  expect(attachPosition!.y).toBeLessThan(cardPosition!.y);
  await page.getByRole("link", { name: "Wróć i dołącz kartę", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent/ })).toBeChecked();

  // A different offer reached independently must expose the existing confirmed card.
  await page.goto("/#/oferty/ai-operations-specialist");
  await page.getByRole("link", { name: "Aplikuj", exact: true }).click();
  const attachment = page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent/ });
  await expect(attachment).not.toBeChecked();
  await attachment.check();
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(own);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  await expect(attachment).toBeChecked();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(own);
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "AI Operations Specialist", exact: true }).click();
  await page.getByRole("tab", { name: "Karta Projektu", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Karta Projektu", exact: true })
      .getByText(own, { exact: true }),
  ).toBeVisible();
});

test("an existing project draft can be completed from a new offer without losing the application", async ({
  page,
}) => {
  await create(page);
  await fill(page);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.goto("/#/aplikuj/ai-product-manager");
  const answer = "Zachowana odpowiedź aplikacji podczas dokończenia istniejącego szkicu projektu.";
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(answer);
  await page
    .getByRole("button", { name: "Dokończ i dołącz: Asystent obsługi zgłoszeń", exact: true })
    .click();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Asystent obsługi zgłoszeń",
  );
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await page.getByRole("link", { name: "Wróć i dołącz kartę", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(answer);
  await expect(page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent/ })).toBeChecked();
  await expect(page.getByRole("button", { name: /^Dokończ i dołącz:/ })).toHaveCount(0);
});

test("detach, cancel removal, recover after reload and delete from a project page", async ({
  page,
}) => {
  await create(page);
  await fill(page);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  const projectId = page.url().split("/").at(-1)!;
  await page.goto(`/#/aplikuj/ai-product-manager?projekt=${projectId}&source=test`);
  const answer = "Najnowsza odpowiedź pozostaje w aplikacji po odłączeniu i usunięciu projektu.";
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(answer);
  const selection = page.getByRole("checkbox", { name: /^Dołącz kartę: Asystent/ });
  const consent = page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ });
  await expect(selection).toBeChecked();
  await consent.check();
  await page.getByRole("button", { name: "Usuń kartę z aplikacji", exact: true }).click();
  await expect(selection).not.toBeChecked();
  await expect(consent).not.toBeChecked();
  await expect(page).not.toHaveURL(/projekt=/);
  await expect(page).toHaveURL(/source=test/);
  await expect(page.locator("#application-project-title")).toBeFocused();
  await page.reload();
  await expect(selection).not.toBeChecked();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(answer);
  await selection.check();
  await selection.uncheck();
  await page.reload();
  await expect(selection).not.toBeChecked();

  await page.goto("/#/app/profil");
  const remove = page.getByRole("button", {
    name: "Usuń projekt: Asystent obsługi zgłoszeń",
    exact: true,
  });
  await remove.click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(remove).toBeFocused();
  await expect(page.locator(".project-list-item")).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 844 });
  await remove.click();
  expect(
    await dialog.evaluate((element) => element.getBoundingClientRect().width <= innerWidth),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Usuń projekt", exact: true }).click();
  await expect(page.locator(".project-list-item")).toHaveCount(0);
  await expect(page.getByText(/^Usunięto projekt „Asystent/)).toBeFocused();
  await page.reload();
  await page.locator(".project-trash summary").click();
  await page
    .getByRole("button", { name: "Przywróć projekt: Asystent obsługi zgłoszeń", exact: true })
    .click();
  await expect(page.locator(".project-list-item")).toHaveCount(1);
  await expect(page.getByText(/^Przywrócono projekt „Asystent/)).toBeFocused();

  await page.goto("/#/aplikuj/ai-product-manager");
  await expect(selection).not.toBeChecked();
  await selection.check();
  await page.getByRole("link", { name: "Zobacz lub popraw wybraną kartę", exact: true }).click();
  await page
    .getByRole("button", { name: "Usuń projekt: Asystent obsługi zgłoszeń", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Usuń projekt", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Aplikuj na ofertę", exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(answer);
  await expect(page.getByRole("checkbox", { name: /^Dołącz kartę:/ })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true }),
  ).toHaveValue(answer);
});

test("removing a library project preserves candidate and recruiter submitted copies", async ({
  page,
}) => {
  await create(page);
  await fill(page);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  const projectId = page.url().split("/").at(-1)!;
  await page.goto(`/#/aplikuj/ai-product-manager?projekt=${projectId}`);
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill(own);
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  const applicationUrl = page.url();
  await page.goto("/#/app/profil");
  await page
    .getByRole("button", { name: "Usuń projekt: Asystent obsługi zgłoszeń", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Usuń projekt", exact: true })
    .click();
  await page.goto(applicationUrl);
  await page.getByRole("tab", { name: "Karta Projektu", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Karta Projektu", exact: true })
      .getByText(own, { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".project-analysis")).toHaveCount(0);
  await choose(page, "Karolina Wiśniewska");
  await page.goto(applicationUrl.replace("/app/aplikacje/", "/app/kandydaci/"));
  await page.getByRole("tab", { name: "Karta Projektu", exact: true }).click();
  const recruiterProject = page.getByRole("tabpanel", { name: "Karta Projektu", exact: true });
  await expect(
    recruiterProject.getByRole("heading", { name: "Co ten projekt wnosi do roli?", exact: true }),
  ).toBeVisible();
  await expect(recruiterProject.locator(".project-preview")).not.toBeVisible();
  await recruiterProject
    .getByText("Przeczytaj potwierdzoną kartę projektu", { exact: true })
    .click();
  await expect(
    recruiterProject.locator(".project-preview").getByText(own, { exact: true }),
  ).toBeVisible();
  await expect(recruiterProject.locator(".recruiter-project-report")).toBeVisible();
});

test("success focus survives consecutive removals and restores of projects with the same name", async ({
  page,
}) => {
  await choose(page);
  for (let index = 0; index < 2; index++) {
    await page.goto("/#/app/profil");
    await page.getByRole("button", { name: "Dodaj projekt", exact: true }).click();
    await page.getByRole("link", { name: "Wróć do profilu", exact: true }).click();
  }
  for (let index = 0; index < 2; index++) {
    await page
      .getByRole("button", { name: "Usuń projekt: Projekt bez nazwy", exact: true })
      .first()
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Usuń projekt", exact: true })
      .click();
    await expect(page.getByText(/^Usunięto projekt „Projekt bez nazwy”/)).toBeFocused();
  }
  await page.locator(".project-trash summary").click();
  for (let index = 0; index < 2; index++) {
    await page
      .getByRole("button", { name: "Przywróć projekt: Projekt bez nazwy", exact: true })
      .first()
      .click();
    await expect(page.getByText(/^Przywrócono projekt „Projekt bez nazwy”/)).toBeFocused();
  }
  await expect(page.locator(".project-list-item")).toHaveCount(2);
});
