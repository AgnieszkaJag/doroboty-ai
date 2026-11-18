import { describe, expect, it, vi } from "vitest";
import { initialState, transition } from "./model";
import { createScenarioStore } from "./scenario-store";
import { parseState, serializeState, STORAGE_KEY, type StoragePort } from "./storage";
import { captureSafeEvent } from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({ captureSafeEvent: vi.fn() }));

function memory() {
  const initial = transition(initialState(), { type: "select_person", id: "employer-brightlabs" });
  let raw = serializeState(initial);
  let writable = true;
  const storage: StoragePort = {
    getItem: () => raw,
    setItem(_key, value) {
      if (!writable) throw new Error("QuotaExceeded");
      raw = value;
    },
  };
  return {
    storage,
    raw: () => raw,
    external: (value: string) => {
      raw = value;
    },
    failWrites: () => {
      writable = false;
    },
  };
}

function submitAnna(store: ReturnType<typeof createScenarioStore>) {
  expect(store.run({ type: "select_person", id: "candidate-anna" })).toBe(true);
  expect(
    store.run({
      type: "submit",
      jobId: store.getSnapshot().state.jobs[0].id,
      answer: "DEMO — samodzielnie przygotowałam i przeprowadziłam pilotaż produktu.",
      notes: "",
      generated: "",
      consent: true,
    }),
  ).toBe(true);
  expect(store.run({ type: "select_person", id: "employer-brightlabs" })).toBe(true);
}

describe("scenario synchronization between open tabs", () => {
  it("adopts a valid external application without writing it back or notifying repeatedly", () => {
    const disk = memory();
    const first = createScenarioStore(() => disk.storage);
    const second = createScenarioStore(() => disk.storage);
    const listener = vi.fn();
    const unsubscribe = second.subscribe(listener);
    submitAnna(first);
    const saved = disk.raw();
    expect(second.getSnapshot().state.applications).toHaveLength(1);
    expect(second.sync()).toBe(true);
    expect(second.getSnapshot().state).toEqual(first.getSnapshot().state);
    expect(disk.raw()).toBe(saved);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(second.sync()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("rejects an action from a tab that missed an update, then retries without losing the new application", () => {
    const disk = memory();
    const first = createScenarioStore(() => disk.storage);
    const stale = createScenarioStore(() => disk.storage);
    submitAnna(first);
    const action = {
      type: "stage" as const,
      applicationId: "application-example",
      stage: "reviewed" as const,
      note: "Checked the original application.",
    };
    const before = disk.raw();
    expect(stale.run(action)).toBe(false);
    expect(disk.raw()).toBe(before);
    expect(stale.getSnapshot().error).toContain("innej karcie");
    expect(stale.getSnapshot().state.applications).toHaveLength(2);
    expect(stale.run(action)).toBe(true);
    const persisted = parseState(disk.raw());
    expect(persisted.applications).toHaveLength(2);
    expect(persisted.applications[0].stage).toBe("reviewed");
    expect(persisted.applications[1]).toEqual(first.getSnapshot().state.applications[1]);
  });

  it("preserves current memory and the corrupt source when an external save is invalid", () => {
    const disk = memory();
    const store = createScenarioStore(() => disk.storage);
    const before = store.getSnapshot().state;
    disk.external('{"version":999}');
    expect(store.sync()).toBe(false);
    expect(store.getSnapshot().state).toBe(before);
    expect(store.getSnapshot().blocked).toBe(true);
    expect(store.getSnapshot().original).toBe('{"version":999}');
    expect(store.run({ type: "select_person", id: "candidate-anna" })).toBe(true);
    expect(store.getSnapshot().state.activePersonId).toBe("candidate-anna");
    expect(disk.raw()).toBe('{"version":999}');
    expect(store.importState(serializeState(store.getSnapshot().state))).toBe(true);
    expect(store.getSnapshot().blocked).toBe(false);
    expect(store.getSnapshot().original).toBeNull();
    expect(parseState(disk.raw()).activePersonId).toBe("candidate-anna");
  });

  it("retains unsaved memory and an exportable external copy when writes fail and another tab changes data", () => {
    const disk = memory();
    const store = createScenarioStore(() => disk.storage);
    disk.failWrites();
    expect(store.run({ type: "select_person", id: "candidate-anna" })).toBe(true);
    const local = store.getSnapshot().state;
    const external = transition(parseState(disk.raw()), {
      type: "stage",
      applicationId: "application-example",
      stage: "reviewed",
      note: "Saved in the other tab.",
    });
    disk.external(serializeState(external));
    expect(store.sync()).toBe(false);
    expect(store.getSnapshot().state).toBe(local);
    expect(store.getSnapshot().blocked).toBe(true);
    expect(store.getSnapshot().issue).toContain("niezapisane zmiany");
    expect(parseState(store.getSnapshot().original!)).toEqual(external);
    expect(parseState(disk.raw())).toEqual(external);
  });

  it("continues in memory when browser storage is unavailable", () => {
    const store = createScenarioStore(() => null);
    expect(store.run({ type: "select_person", id: "candidate-anna" })).toBe(true);
    expect(store.sync()).toBe(false);
    expect(store.getSnapshot().state.activePersonId).toBe("candidate-anna");
    expect(store.getSnapshot().issue).toContain("eksport");
  });

  it("recovers cleanly when a corrupt external save is replaced by valid data", () => {
    const disk = memory();
    const store = createScenarioStore(() => disk.storage);
    const valid = disk.raw();
    disk.external("{");
    store.sync();
    disk.external(valid);
    store.sync();
    expect(store.getSnapshot().blocked).toBe(false);
    expect(store.getSnapshot().issue).toBe("");
    expect(store.getSnapshot().original).toBeNull();
  });

  it("keeps invalid imports harmless and propagates an explicit reset to other tabs", () => {
    const disk = memory();
    const first = createScenarioStore(() => disk.storage);
    const second = createScenarioStore(() => disk.storage);
    const before = disk.raw();
    expect(first.importState("{")).toBe(false);
    expect(disk.raw()).toBe(before);
    first.reset();
    expect(second.sync()).toBe(true);
    expect(second.getSnapshot().state).toEqual(initialState());
    expect(parseState(disk.storage.getItem(STORAGE_KEY)!)).toEqual(initialState());
  });
});

describe("persisted submission and failure evidence", () => {
  it("records a successful submission only after it has been saved", () => {
    vi.mocked(captureSafeEvent).mockClear();
    const disk = memory();
    const store = createScenarioStore(() => disk.storage);
    submitAnna(store);
    expect(captureSafeEvent).toHaveBeenCalledWith("application_submitted");
    expect(
      vi.mocked(captureSafeEvent).mock.calls.filter(([name]) => name === "application_submitted"),
    ).toHaveLength(1);
    expect(store.getSnapshot().unsaved).toBe(false);
  });
  it("retains the draft and rejects submission when storage fails, without a success event", () => {
    vi.mocked(captureSafeEvent).mockClear();
    const disk = memory();
    const store = createScenarioStore(() => disk.storage);
    store.run({ type: "select_person", id: "candidate-anna" });
    const draft = {
      type: "draft" as const,
      jobId: store.getSnapshot().state.jobs[0].id,
      answer: "Syntetyczna odpowiedź na ofertę pracy.",
      notes: "",
      generated: "",
    };
    store.run(draft);
    const before = disk.raw();
    disk.failWrites();
    store.run({ ...draft, answer: "Najnowsza syntetyczna odpowiedź do zachowania w pamięci." });
    expect(store.getSnapshot().unsaved).toBe(true);
    expect(store.run({ ...draft, type: "submit", consent: true })).toBe(false);
    expect(disk.raw()).toBe(before);
    expect(store.getSnapshot().state.drafts[0].answer).toContain("Najnowsza");
    expect(store.getSnapshot().state.applications).toHaveLength(1);
    expect(store.getSnapshot().error).toContain("Nie zapisano aplikacji");
    expect(captureSafeEvent).toHaveBeenCalledWith("prototype_error", "storage_write");
    expect(captureSafeEvent).not.toHaveBeenCalledWith("application_submitted");
    expect(
      vi.mocked(captureSafeEvent).mock.calls.filter(([, code]) => code === "storage_write"),
    ).toHaveLength(1);
  });
});
