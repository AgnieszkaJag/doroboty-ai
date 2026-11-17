import { describe, expect, it } from "vitest";
import { initialState, transition, stateSchema, type State } from "./model";
import { analyzeProject, newProjectInput, type ProjectInput } from "./project-card-model";
import { parseState, serializeState, saveState } from "./storage";
const time = "2026-11-10T18:00:00.000Z";
const value: ProjectInput = {
  ...newProjectInput("project-anna"),
  title: "Asystent zgłoszeń",
  context:
    "Projekt dla zespołu obsługi klienta, który ręcznie przypisywał zgłoszenia. Byłam projektantką produktu.",
  personal:
    "Samodzielnie przeprowadziłam wywiady i zaprojektowałam prototyp. Odpowiadałam za testy. Wybrałam ręczne zatwierdzanie, ponieważ pomyłki modelu wymagały kontroli.",
  teamwork: "Engineering zbudował integrację i model. Product manager ustalił zakres pilotażu.",
  outcome:
    "W testach prototypu 9 z 12 konsultantów ukończyło zadanie bez pomocy. Dane pochodzą z arkusza obserwacji.",
};
function candidate() {
  return transition(initialState(), { type: "select_person", id: "candidate-anna" });
}
function confirmed(input = value) {
  let state = transition(
    candidate(),
    { type: "project_save", value: input, mode: "analyze" },
    time,
  );
  const card = state.projectCards[0];
  if (card.workflow !== "preview")
    state = transition(state, { type: "project_save", value: card, mode: "preview" }, time);
  return transition(state, { type: "project_confirm", id: input.id }, time);
}
function submit(state: State, jobId: string, id: string) {
  return transition(
    state,
    {
      type: "submit",
      jobId,
      notes: "",
      generated: "",
      answer: "Przykładowa aplikacja z opisem doświadczenia.",
      consent: true,
      projectCardId: value.id,
    },
    time,
    id,
  );
}

describe("reusable project cards", () => {
  it("accepts legacy version-1 saves and round-trips current source and analysis", () => {
    const legacy = { ...initialState() } as Partial<State>;
    delete legacy.projectCards;
    delete legacy.deletedProjectCards;
    expect(parseState(JSON.stringify(legacy)).projectCards).toEqual([]);
    expect(parseState(JSON.stringify(legacy)).deletedProjectCards).toEqual([]);
    const state = confirmed();
    expect(parseState(serializeState(state))).toEqual(state);
    expect(state.projectCards[0].analysis?.engine).toBe("local-completeness-v1");
  });
  it("checks five narrative areas without requiring a numeric result", () => {
    const qualitative = {
      ...value,
      outcome:
        "Z obserwacji testów i opinii użytkowników wynika, że nowy przepływ jest łatwiejszy do zrozumienia.",
    };
    expect(analyzeProject(qualitative).checks.find((item) => item.area === "outcome")?.status).toBe(
      "described",
    );
  });
  it("does not confuse collective work with a first-person contribution", () => {
    const collective = {
      ...value,
      personal:
        "Razem z zespołem opracowaliśmy rozwiązanie i wspólnie przeprowadziliśmy jego wdrożenie.",
    };
    expect(
      analyzeProject(collective).checks.find((check) => check.area === "personal")?.status,
    ).toBe("partial");
  });
  it("rejects imported stale analysis in live cards and submitted copies", () => {
    const live = confirmed();
    live.projectCards[0].personal = "Inny opis własnej pracy.";
    expect(() => parseState(serializeState(live))).toThrow();
    const submitted = submit(confirmed(), initialState().jobs[0].id, "snapshot-analysis");
    submitted.applications.at(-1)!.projectCard!.outcome = "Inny wynik.";
    expect(() => parseState(serializeState(submitted))).toThrow();
  });
  it("opens the AI report directly even when the narrative has gaps", () => {
    const incomplete = {
      ...value,
      personal: "Pracowaliśmy nad projektem.",
      teamwork: "Wspólnie.",
      outcome: "Nie mam danych.",
    };
    let state = transition(
      candidate(),
      { type: "project_save", value: incomplete, mode: "analyze" },
      time,
    );
    expect(state.projectCards[0].workflow).toBe("preview");
    expect(state.projectCards[0].followUps).toEqual([]);
    expect(
      state.projectCards[0].analysis?.checks.find((check) => check.area === "personal")?.status,
    ).toBe("partial");
    state = transition(
      state,
      { type: "project_save", value: state.projectCards[0], mode: "analyze" },
      time,
    );
    expect(state.projectCards[0].followUps).toEqual([]);
    expect(
      transition(state, { type: "project_confirm", id: value.id }, time).projectCards[0].status,
    ).toBe("confirmed");
  });
  it("resumes legacy question drafts through the form and preserves editable old information", () => {
    let state = transition(candidate(), { type: "project_save", value, mode: "analyze" }, time);
    const old = state.projectCards[0];
    old.followUps = [
      {
        area: "personal",
        question: "Historyczne pytanie o własną pracę",
        answer: "Osobiście przygotowałam mapę procesu.",
        skipped: false,
      },
    ];
    old.followUpsAsked = true;
    old.workflow = "followups";
    old.analysis = analyzeProject(old, old.followUps);
    state = parseState(serializeState(state));
    const sources = structuredClone(state.projectCards[0].followUps);
    state = transition(
      state,
      { type: "project_save", value: state.projectCards[0], mode: "draft" },
      time,
    );
    expect(state.projectCards[0].workflow).toBe("edit");
    state = transition(
      state,
      { type: "project_save", value: state.projectCards[0], mode: "analyze" },
      time,
    );
    expect(state.projectCards[0].workflow).toBe("preview");
    expect(state.projectCards[0].followUps).toEqual(sources);
    expect(
      state.projectCards[0].analysis?.checks.find((check) => check.area === "personal")?.quote,
    ).toContain(sources[0].answer);
    state = transition(state, { type: "project_confirm", id: value.id }, time);
    state = submit(state, state.jobs[0].id, "legacy-snapshot");
    const snapshot = structuredClone(state.applications.at(-1)!.projectCard);
    expect(parseState(serializeState(state))).toEqual(state);
    state = transition(
      state,
      {
        type: "project_save",
        value: {
          ...state.projectCards[0],
          workflow: "edit",
          followUps: sources.map((item) => ({ ...item, answer: "" })),
        },
        mode: "draft",
      },
      time,
    );
    expect(state.projectCards[0].analysis).toBeUndefined();
    state = transition(
      state,
      { type: "project_save", value: state.projectCards[0], mode: "analyze" },
      time,
    );
    expect(
      state.projectCards[0].analysis?.checks.find((check) => check.area === "personal")?.quote,
    ).not.toContain(sources[0].answer);
    expect(state.applications.at(-1)!.projectCard).toEqual(snapshot);
    expect(parseState(serializeState(state)).applications.at(-1)!.projectCard).toEqual(snapshot);
  });
  it("protects ownership on editing, confirmation, attachment and import", () => {
    const original = confirmed();
    for (const id of ["candidate-marek", "employer-brightlabs", "operator-wojtek"]) {
      const state = transition(original, {
        type: "select_person",
        id:
          id === "operator-wojtek"
            ? original.people.find((person) => person.role === "operator")!.id
            : id,
      });
      expect(() => transition(state, { type: "project_save", value, mode: "draft" })).toThrow();
      expect(() => transition(state, { type: "project_confirm", id: value.id })).toThrow();
      expect(() => submit(state, state.jobs[1].id, "wrong-owner")).toThrow();
    }
    const broken = structuredClone(original);
    broken.projectCards[0].candidateId = "employer-brightlabs";
    expect(stateSchema.safeParse(broken).success).toBe(false);
  });
  it("requires a fresh review after any source or follow-up edit", () => {
    let state = confirmed();
    state = transition(
      state,
      {
        type: "project_save",
        value: {
          ...state.projectCards[0],
          personal: "Zmieniona własna odpowiedzialność.",
          workflow: "edit",
        },
        mode: "draft",
      },
      time,
    );
    expect(state.projectCards[0].status).toBe("draft");
    expect(state.projectCards[0].analysis).toBeUndefined();
    expect(() => transition(state, { type: "project_confirm", id: value.id })).toThrow();
    expect(() => submit(state, state.jobs[0].id, "unconfirmed")).toThrow();
  });
  it("snapshots a reusable card independently from later edits or missing originals", () => {
    let state = confirmed();
    state = submit(state, state.jobs[0].id, "project-app-one");
    state = submit(state, state.jobs[1].id, "project-app-two");
    const copy = structuredClone(state.applications.at(-2)!.projectCard);
    state = transition(
      state,
      {
        type: "project_save",
        value: { ...state.projectCards[0], context: "Zmieniony kontekst", workflow: "edit" },
        mode: "draft",
      },
      time,
    );
    expect(state.applications.at(-2)!.projectCard).toEqual(copy);
    expect(state.applications.at(-1)!.projectCard).toEqual(copy);
    state.projectCards = [];
    expect(parseState(serializeState(state)).applications.at(-1)!.projectCard).toEqual(copy);
  });
  it("saves a partial draft and retains data for export if storage fails", () => {
    const state = transition(
      candidate(),
      {
        type: "project_save",
        value: { ...newProjectInput("draft"), personal: "Moje rozpoczęte notatki" },
        mode: "draft",
      },
      time,
    );
    expect(state.projectCards[0].status).toBe("draft");
    expect(() =>
      transition(state, { type: "project_save", value: state.projectCards[0], mode: "analyze" }),
    ).toThrow("Uzupełnij");
    expect(() =>
      saveState(
        {
          getItem: () => "old",
          setItem: () => {
            throw Error("quota");
          },
        },
        state,
      ),
    ).toThrow("Wyeksportuj");
    expect(parseState(serializeState(state)).projectCards[0].personal).toBe(
      "Moje rozpoczęte notatki",
    );
  });
  it("removes an owned project from drafts while preserving their text and submitted copies", () => {
    let state = confirmed();
    state = submit(state, state.jobs[0].id, "submitted-before-removal");
    const snapshot = structuredClone(state.applications.at(-1)!.projectCard);
    const original = structuredClone(state.projectCards[0]);
    state = transition(state, {
      type: "project_save",
      value: newProjectInput("other-project"),
      mode: "draft",
    });
    for (const [index, job] of state.jobs.slice(1, 4).entries())
      state = transition(state, {
        type: "draft",
        jobId: job.id,
        projectCardId: index < 2 ? value.id : "other-project",
        notes: `Source ${index}`,
        generated: `Legacy ${index}`,
        answer: `Application ${index}`,
      });
    state = transition(state, { type: "select_person", id: "candidate-marek" });
    state = transition(state, {
      type: "draft",
      jobId: state.jobs[1].id,
      notes: "Other candidate source",
      generated: "Other candidate legacy",
      answer: "Other candidate answer",
    });
    state = transition(state, { type: "select_person", id: "candidate-anna" });
    const before = structuredClone(state.drafts);
    state = transition(state, { type: "project_delete", id: value.id });
    expect(state.projectCards.map((card) => card.id)).toEqual(["other-project"]);
    expect(state.deletedProjectCards).toEqual([original]);
    expect(state.drafts).toEqual(
      before.map((draft) => {
        if (draft.candidateId !== "candidate-anna" || draft.projectCardId !== value.id)
          return draft;
        const detached = { ...draft };
        delete detached.projectCardId;
        return detached;
      }),
    );
    expect(state.applications.at(-1)!.projectCard).toEqual(snapshot);
    expect(parseState(serializeState(state))).toEqual(state);
    expect(() => submit(state, state.jobs[4].id, "removed-card")).toThrow();
    expect(() => transition(state, { type: "project_save", value, mode: "draft" })).toThrow(
      "Przywróć",
    );
    expect(() => transition(state, { type: "project_confirm", id: value.id })).toThrow();
    const detachedDrafts = structuredClone(state.drafts);
    state = transition(state, { type: "project_restore", id: value.id });
    expect(state.projectCards[0]).toEqual(original);
    expect(state.deletedProjectCards).toEqual([]);
    expect(state.drafts).toEqual(detachedDrafts);
    expect(state.applications.at(-1)!.projectCard).toEqual(snapshot);
    expect(parseState(serializeState(state))).toEqual(state);
  });
  it("removes and restores partial drafts without altering their source", () => {
    let state = transition(candidate(), {
      type: "project_save",
      value: { ...newProjectInput("partial-to-remove"), personal: "Rozpoczęta własna praca" },
      mode: "draft",
    });
    const original = structuredClone(state.projectCards[0]);
    state = transition(state, { type: "project_delete", id: original.id });
    state = parseState(serializeState(state));
    state = transition(state, { type: "project_restore", id: original.id });
    expect(state.projectCards[0]).toEqual(original);
    expect(state.projectCards[0].status).toBe("draft");
  });
  it("requires the candidate owner for removal and restoration and rejects duplicate trash IDs", () => {
    const original = confirmed();
    const removed = transition(original, { type: "project_delete", id: value.id });
    for (const id of [
      "candidate-marek",
      "employer-brightlabs",
      original.people.find((person) => person.role === "operator")!.id,
    ]) {
      expect(() =>
        transition(transition(original, { type: "select_person", id }), {
          type: "project_delete",
          id: value.id,
        }),
      ).toThrow();
      expect(() =>
        transition(transition(removed, { type: "select_person", id }), {
          type: "project_restore",
          id: value.id,
        }),
      ).toThrow();
    }
    const duplicate = structuredClone(original);
    duplicate.deletedProjectCards.push(original.projectCards[0]);
    expect(stateSchema.safeParse(duplicate).success).toBe(false);
    const badOwner = structuredClone(removed);
    badOwner.deletedProjectCards[0].candidateId = "employer-brightlabs";
    expect(stateSchema.safeParse(badOwner).success).toBe(false);
  });
  it("detaches a draft selection without deleting the library card or latest application text", () => {
    let state = confirmed();
    state = transition(state, {
      type: "draft",
      jobId: state.jobs[1].id,
      projectCardId: value.id,
      notes: "Legacy source",
      generated: "Legacy copy",
      answer: "Earlier application",
    });
    state = transition(state, {
      type: "draft",
      jobId: state.jobs[1].id,
      notes: "Legacy source",
      generated: "Legacy copy",
      answer: "Latest unsaved application answer",
    });
    const restored = parseState(serializeState(state));
    expect(restored.projectCards[0].id).toBe(value.id);
    expect(restored.drafts[0]).toMatchObject({
      answer: "Latest unsaved application answer",
      notes: "Legacy source",
      generated: "Legacy copy",
    });
    expect(restored.drafts[0].projectCardId).toBeUndefined();
  });
});
