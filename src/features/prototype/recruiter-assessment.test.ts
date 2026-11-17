import { describe, expect, it } from "vitest";
import { initialState, transition, stateSchema, type State } from "./model";
import { newProjectInput } from "./project-card-model";
import { parseState, serializeState } from "./storage";
import {
  assessApplication,
  rubricFor,
  rubricIsCurrent,
  recruiterListPath,
  recruiterDetailPath,
} from "./recruiter-assessment";
import { recruiterProjectReport } from "./recruiter-project-report";

const time = "2026-11-11T10:00:00.000Z";
const criteria = [
  "Samodzielne badania i wywiady z użytkownikami.",
  "Integracje API oraz obsługa błędów.",
  "Programowanie w Pythonie.",
];
function employer(state = initialState()) {
  return transition(state, { type: "select_person", id: "employer-brightlabs" });
}
function confirm(state = employer(), next = criteria) {
  return transition(
    state,
    { type: "rubric_confirm", jobId: state.jobs[0].id, criteria: next },
    time,
  );
}
function submitted() {
  let state = transition(initialState(), { type: "select_person", id: "candidate-anna" });
  state = transition(
    state,
    {
      type: "project_save",
      mode: "analyze",
      value: {
        ...newProjectInput("rubric-project"),
        title: "Asystent zgłoszeń",
        context: "Dla zespołu obsługi klienta, który ręcznie przypisywał sprawy.",
        personal:
          "Samodzielnie przeprowadziłam wywiady z użytkownikami. Wybrałam prototyp, ponieważ potrzebowaliśmy testu.",
        teamwork: "Engineering wykonał integracje API i obsługę błędów.",
        outcome: "W testach 9 z 12 osób ukończyło zadanie. Podstawa: arkusz obserwacji.",
      },
    },
    time,
  );
  state = transition(state, { type: "project_confirm", id: "rubric-project" }, time);
  state = transition(
    state,
    {
      type: "submit",
      jobId: state.jobs[0].id,
      answer: "Samodzielnie zbudowałam integracje API i obsługę błędów.",
      notes: "Prywatna notatka o Pythonie.",
      generated: "Niepotwierdzona propozycja o Pythonie.",
      consent: true,
      projectCardId: "rubric-project",
    },
    time,
    "rubric-application",
  );
  state.applications.at(-1)!.cv = "Odpowiadałam za programowanie w Pythonie.";
  return confirm(employer(state));
}

describe("confirmed recruiter role criteria and material coverage", () => {
  it("accepts old saves without criteria and round-trips confirmed role/profile snapshots", () => {
    const legacy = { ...initialState() } as Partial<State>;
    delete legacy.roleRubrics;
    expect(parseState(JSON.stringify(legacy)).roleRubrics).toEqual([]);
    const state = submitted();
    expect(parseState(serializeState(state))).toEqual(state);
    expect(state.applications.at(-1)!.candidateSnapshot?.headline).toBe(
      "Product Manager · AI i automatyzacja",
    );
    state.applications.at(-1)!.candidateSnapshot!.name = "Inny kandydat";
    expect(stateSchema.safeParse(state).success).toBe(false);
  });
  it("requires employer ownership and one to five distinct substantive criteria", () => {
    for (const id of ["candidate-anna", "employer-northstar"])
      expect(() => confirm(transition(initialState(), { type: "select_person", id }))).toThrow();
    for (const invalid of [
      [],
      ["short"],
      [criteria[0], criteria[0].toLocaleLowerCase("pl")],
      Array(6).fill(criteria[0]),
    ])
      expect(() => confirm(employer(), invalid)).toThrow();
    const state = confirm();
    expect(rubricFor(state, state.jobs[0].id)?.version).toBe(1);
  });
  it("rejects duplicate and foreign rubric references on import", () => {
    const state = confirm();
    state.roleRubrics.push({ ...state.roleRubrics[0] });
    expect(stateSchema.safeParse(state).success).toBe(false);
    const foreign = confirm();
    foreign.roleRubrics[0].companyId = "company-northstar";
    expect(stateSchema.safeParse(foreign).success).toBe(false);
    const author = confirm();
    author.roleRubrics[0].confirmedBy = "candidate-anna";
    expect(stateSchema.safeParse(author).success).toBe(false);
  });
  it("keeps confirmed criteria stable after job edits until the recruiter reconfirms a new version", () => {
    let state = submitted();
    const original = structuredClone(state.roleRubrics[0]);
    const before = assessApplication(state.applications.at(-1)!, original);
    state = transition(state, {
      type: "publish",
      job: {
        ...state.jobs[0],
        description: "Zmieniony opis roli i inny zakres odpowiedzialności.",
      },
    });
    expect(state.roleRubrics[0]).toEqual(original);
    expect(rubricIsCurrent(state.roleRubrics[0], state.jobs[0])).toBe(false);
    expect(assessApplication(state.applications.at(-1)!, state.roleRubrics[0])).toEqual(before);
    state = confirm(state, ["Programowanie w Pythonie."]);
    expect(state.roleRubrics[0].version).toBe(2);
    expect(rubricIsCurrent(state.roleRubrics[0], state.jobs[0])).toBe(true);
  });
  it("uses the best submitted example per criterion and the identical project rubric", () => {
    const state = submitted();
    const app = state.applications.at(-1)!;
    const rubric = state.roleRubrics[0];
    const assessment = assessApplication(app, rubric)!;
    expect(assessment.overall.percent).toBe(100);
    expect(assessment.overall.points).toBe(6);
    expect(assessment.project?.percent).toBe(50);
    expect(assessment.project?.points).toBe(3);
    expect(assessment.project?.observations).toEqual(
      recruiterProjectReport(app.projectCard!, rubric.role, rubric.criteria).observations,
    );
    expect(assessment.overall.observations[2].evidence?.source).toBe("CV z aplikacji");
  });
  it("distinguishes unavailable criteria, absent cards and true zero material coverage", () => {
    const state = submitted();
    const app = state.applications.at(-1)!;
    const rubric = state.roleRubrics[0];
    expect(assessApplication(app)).toBeNull();
    expect(assessApplication(app, { ...rubric, jobId: state.jobs[1].id })).toBeNull();
    const noCard = assessApplication({ ...app, projectCard: undefined }, rubric)!;
    expect(noCard.project).toBeNull();
    const zero = assessApplication(
      {
        ...app,
        cv: "Brak informacji o doświadczeniu.",
        answer: "Brak informacji o doświadczeniu.",
        projectCard: undefined,
      },
      rubric,
    )!;
    expect(zero.overall.percent).toBe(0);
    expect(zero.project).toBeNull();
  });
  it("ignores persona examples, unapproved legacy copy and later profile/project changes", () => {
    let state = submitted();
    const app = state.applications.at(-1)!;
    const rubric = state.roleRubrics[0];
    const original = assessApplication(app, rubric);
    expect(
      assessApplication(
        {
          ...app,
          score: 0,
          summary: "Other fixture",
          sourceNotes: "Nie używać tego źródła.",
          generatedAnswer: "Nie używać tej propozycji.",
        },
        rubric,
      ),
    ).toEqual(original);
    state = transition(state, { type: "select_person", id: "candidate-anna" });
    state = transition(state, {
      type: "profile",
      value: {
        name: "Zmienione nazwisko",
        headline: "Zmieniony profil",
        bio: "Nowa biografia",
        location: "Kraków",
      },
    });
    state = transition(state, { type: "project_delete", id: "rubric-project" });
    expect(assessApplication(state.applications.at(-1)!, rubric)).toEqual(original);
    expect(state.applications.at(-1)!.candidateSnapshot?.name).toBe("Anna Kowalska");
  });
  it("preserves role/search context without accepting arbitrary return URLs or tab parameters", () => {
    const params = new URLSearchParams({
      oferta: "role-1",
      q: "Anna & Marek",
      sekcja: "cv",
      next: "https://example.com",
    });
    expect(recruiterListPath(params)).toBe("/app/kandydaci?oferta=role-1&q=Anna+%26+Marek");
    expect(recruiterDetailPath("app-1", params)).toBe(
      "/app/kandydaci/app-1?oferta=role-1&q=Anna+%26+Marek",
    );
    expect(recruiterDetailPath("app-1", params, true)).toBe(
      "/app/kandydaci/app-1?oferta=role-1&q=Anna+%26+Marek&sekcja=analysis",
    );
  });
});
