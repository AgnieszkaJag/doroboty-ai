import { test, expect } from "./fixtures";
import { RESEARCH_SESSION_KEY } from "../../src/lib/research-session";

test("configured but unavailable analytics cannot block project confirmation, submission or recovery", async ({
  page,
  context,
}) => {
  const blocked: string[] = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:3107") return route.continue();
    blocked.push(url.hostname);
    return route.abort("failed");
  });
  const started = Date.now();
  await page.goto("/#/testy");
  await page.getByRole("button", { name: "Rozpocznij test", exact: true }).click();
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.getByRole("button", { name: "Dodaj nowy projekt", exact: true }).click();
  for (const [label, value] of [
    ["Nazwa projektu", "Syntetyczny projekt obsługi zgłoszeń"],
    [
      "Kontekst i Twoja rola",
      "Zespół ręcznie obsługiwał zgłoszenia. Jako projektantka przygotowałam fikcyjny pilotaż.",
    ],
    [
      "Moja praca i odpowiedzialność",
      "Samodzielnie przeprowadziłam wywiady i zaprojektowałam prototyp. Odpowiadałam za testy i ręczną kontrolę wyniku.",
    ],
    [
      "Praca pozostałych osób",
      "Engineering przygotował integrację. Product manager wybrał zakres pilotażu.",
    ],
    [
      "Rezultat i jego podstawa",
      "W testach 9 z 12 konsultantów ukończyło zadanie. Wynik pochodzi z fikcyjnego arkusza obserwacji.",
    ],
  ])
    await page.getByRole("textbox", { name: label, exact: true }).fill(value);
  await page.getByRole("button", { name: "Sprawdź opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź i zapisz kartę", exact: true }).click();
  await page.goto("/#/aplikuj/ai-product-manager");
  await page.getByRole("checkbox", { name: /^Dołącz kartę: Syntetyczny projekt/ }).check();
  await page
    .getByRole("textbox", { name: "Dlaczego pasujesz do tej roli?", exact: true })
    .fill("Syntetyczna odpowiedź do testu odporności na niedostępną analitykę.");
  await page.getByRole("checkbox", { name: /^Zatwierdzam treść i przesłanie aplikacji/ }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moje aplikacje", exact: true })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(15000);
  await expect.poll(() => blocked.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "AI Product Manager", exact: true })).toBeVisible();
  const run = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    RESEARCH_SESSION_KEY,
  );
  expect(run.checkpoints.project_confirmed).toBeTruthy();
  expect(run.checkpoints.application_submitted).toBeTruthy();
  await page.goto("/#/testy?etap=koniec");
  await page.getByRole("button", { name: "Udało mi się ukończyć zadanie", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Zapisano zakończenie próby");
  expect([...new Set(blocked)]).toContain("analytics.invalid");
});
