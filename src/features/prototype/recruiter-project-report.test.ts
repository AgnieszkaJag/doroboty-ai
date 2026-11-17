import { describe, expect, it } from "vitest";
import { initialState, transition } from "./model";
import { newProjectInput, type ProjectCard } from "./project-card-model";
import { parseState, serializeState } from "./storage";
import { recruiterProjectReport, selectedExpectations } from "./recruiter-project-report";

const role = {
  title: "AI Product Manager",
  summary: "Badania, prototypy i integracje.",
  description:
    "### Zadania\n\n- Samodzielne badania i wywiady z użytkownikami.\n- Przygotowanie prototypu i eksperymentu.\n- Integracje API.\n\n### Wymagania\n\nPraca w Pythonie.\n\n### Warunki współpracy\n\nWarszawa, 20 000 zł, B2B.\n\n### Rekrutacja\n\nRozmowa i zadanie.",
};
const card: ProjectCard = {
  ...newProjectInput("report-project"),
  candidateId: "candidate-anna",
  status: "draft",
  followUpsAsked: false,
  updatedAt: "2026-11-11T10:00:00.000Z",
  title: "Asystent zgłoszeń",
  context: "Projekt dla obsługi klienta.",
  personal:
    "Samodzielnie przeprowadziłam wywiady z użytkownikami. Zaprojektowałam prototyp i eksperyment.",
  teamwork: "Zespół wykonał integracje API.",
  outcome: "W testach 9 z 12 osób ukończyło zadanie. Dane z arkusza obserwacji.",
};

describe("recruiter project evidence report", () => {
  it("selects at most five verbatim work expectations, excluding organizational sections", () => {
    const expectations = selectedExpectations(role);
    expect(expectations).toHaveLength(4);
    for (const expectation of expectations) expect(role.description).toContain(expectation);
    expect(expectations.join(" ")).not.toMatch(/Warszawa|B2B|Rozmowa/);
    expect(selectedExpectations(initialState().jobs[0]).length).toBeLessThanOrEqual(5);
  });
  it("does not invent criteria from empty or organizational-only text", () => {
    for (const description of ["", "### Warunki współpracy\nWarszawa, B2B.", "Warszawa, B2B."]) {
      expect(selectedExpectations({ ...role, description })).toEqual([]);
      expect(recruiterProjectReport(card, { ...role, description }).observations).toEqual([]);
    }
    expect(recruiterProjectReport(card).questions.length).toBeGreaterThan(0);
  });
  it("recognizes numbered tasks as text rather than list numerals", () => {
    const numbered = {
      ...role,
      description:
        "### Zadania\n\n1. Rozpiszesz proces obsługi.\n2. Przygotujesz integracje API.\n3) Zmierzysz czas odpowiedzi.",
    };
    expect(selectedExpectations(numbered)).toEqual([
      "Rozpiszesz proces obsługi.",
      "Przygotujesz integracje API.",
      "Zmierzysz czas odpowiedzi.",
    ]);
  });
  it("separates personal examples, team-only context and missing information with source quotes", () => {
    const report = recruiterProjectReport(card, role);
    expect(report.observations.map((item) => item.status)).toEqual([
      "personal",
      "personal",
      "related",
      "missing",
    ]);
    expect(report.observations[2].evidence?.source).toBe("Praca pozostałych osób");
    expect(report.outcome).toBe(card.outcome);
    for (const observation of report.observations) {
      if (observation.evidence)
        expect([card.personal, card.teamwork, card.context, card.outcome].join(" ")).toContain(
          observation.evidence.quote,
        );
    }
    expect(report.questions[0]).toContain("Python");
  });
  it("does not convert generic AI/project vocabulary into a match", () => {
    const generic = {
      ...card,
      personal: "Samodzielnie zrobiłam projekt AI i produkt.",
      teamwork: "Projekt AI.",
      context: "Produkt.",
      outcome: "Projekt zakończony.",
    };
    expect(
      recruiterProjectReport(generic, role).observations.every((item) => item.status === "missing"),
    ).toBe(true);
  });
  it("does not attribute denied work to the candidate", () => {
    const denied = {
      ...card,
      personal:
        "Nie odpowiadałam za integracje API; wykonał je zespół. Samodzielnie zaprojektowałam prototyp.",
    };
    const observation = recruiterProjectReport(denied, role).observations[2];
    expect(observation.status).toBe("related");
    expect(observation.evidence?.source).toBe("Praca pozostałych osób");
    expect(recruiterProjectReport(denied, role).contribution).toContain("prototyp");
    expect(
      recruiterProjectReport({ ...card, personal: "Nie zbudowałam integracji API." }, role)
        .observations[2].status,
    ).toBe("related");
    for (const personal of [
      "Samodzielnie przeprowadziłam wywiady, a integrację API zbudował zespół.",
      "Samodzielnie przeprowadziłam wywiady i integrację API zbudował zespół.",
      "Zespół samodzielnie zbudował integracje API.",
      "Przeprowadziłam wywiady i integrację API zaprojektował zespół.",
      "Przeprowadziłam wywiady i integrację API projektuje zespół.",
    ]) {
      expect(recruiterProjectReport({ ...card, personal }, role).observations[2].status).toBe(
        "related",
      );
    }
  });
  it("recognizes present-tense first-person actions without confusing them with another actor", () => {
    const present = {
      ...card,
      personal: "Samodzielnie projektuję prototyp, prowadzę badania i odpowiadam za testy.",
    };
    expect(recruiterProjectReport(present, role).observations[1].status).toBe("personal");
    expect(
      recruiterProjectReport({ ...card, personal: "Designer projektuje prototyp." }, role)
        .observations[1].status,
    ).toBe("related");
    expect(
      recruiterProjectReport({ ...card, personal: "Jako designer zaprojektowałam prototyp." }, role)
        .observations[1].status,
    ).toBe("personal");
    expect(
      recruiterProjectReport(
        { ...card, personal: "Jako inżynier samodzielnie wdrożyłem integrację API." },
        role,
      ).observations[2].status,
    ).toBe("personal");
  });
  it("uses active legacy contributions but never skipped answers", () => {
    const legacy = {
      ...card,
      followUps: [
        {
          area: "personal" as const,
          question: "Wkład?",
          answer: "Samodzielnie pracowałam w Pythonie.",
          skipped: false,
        },
      ],
    };
    expect(recruiterProjectReport(legacy, role).observations[3].status).toBe("personal");
    legacy.followUps[0].skipped = true;
    expect(recruiterProjectReport(legacy, role).observations[3].status).toBe("missing");
  });
  it("surfaces missing result evidence as an interview topic, not advice to rewrite the card", () => {
    const report = recruiterProjectReport(
      { ...card, outcome: "Nie mam danych.", teamwork: "Wspólnie." },
      role,
    );
    expect(report.gaps.some((gap) => gap.note.includes("rezultatu"))).toBe(true);
    expect(report.questions.some((question) => question.includes("rezultat"))).toBe(true);
    expect(report.questions.length).toBeLessThanOrEqual(3);
  });
  it("snapshots the role on submit, preserves it across edits/imports and accepts old records", () => {
    let state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
    state = transition(state, { type: "project_save", value: card, mode: "analyze" });
    state = transition(state, { type: "project_confirm", id: card.id });
    state = transition(state, {
      type: "submit",
      jobId: state.jobs[0].id,
      answer: "Opis doświadczenia dla rekrutera.",
      notes: "",
      generated: "",
      consent: true,
      projectCardId: card.id,
    });
    const application = state.applications.at(-1)!;
    const before = recruiterProjectReport(application.projectCard!, application.roleSnapshot);
    state.jobs[0].description = "Zmieniona treść oferty nie zmienia kopii wysłanej aplikacji.";
    state.projectCards[0].status = "draft";
    state.projectCards[0].analysis = undefined;
    state.projectCards[0].personal = "Zmieniony opis własnej pracy.";
    const restored = parseState(serializeState(state));
    expect(restored.applications.at(-1)!.roleSnapshot).toEqual(application.roleSnapshot);
    expect(
      recruiterProjectReport(
        restored.applications.at(-1)!.projectCard!,
        restored.applications.at(-1)!.roleSnapshot,
      ),
    ).toEqual(before);
    delete restored.applications.at(-1)!.roleSnapshot;
    expect(parseState(serializeState(restored)).applications.at(-1)!.roleSnapshot).toBeUndefined();
  });
});
