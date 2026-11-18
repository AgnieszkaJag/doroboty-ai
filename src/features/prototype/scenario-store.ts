import { initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, serializeState, type StoragePort } from "./storage";
import { captureSafeEvent } from "@/lib/posthog";
import { recordResearchCheckpoint } from "@/lib/research-session";

/** Shared scenario controller; browser events only request a read, never a write. */
export function createScenarioStore(storage: () => StoragePort | null) {
  const loaded = readState(storage());
  let snapshot = { ...loaded, error: "", unsaved: false };
  let saved = serializeState(loaded.state);
  let dirty = false;
  let reportedWriteFailure = false;
  const listeners = new Set<() => void>();
  function update(patch: Partial<typeof snapshot>) {
    if (
      Object.entries(patch).every(
        ([key, value]) => snapshot[key as keyof typeof snapshot] === value,
      )
    )
      return;
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }
  function sync() {
    const external = readState(storage());
    if (external.issue) {
      update({
        issue: external.issue,
        ...(external.blocked ? { blocked: true, original: external.original } : {}),
      });
      return false;
    }
    const serialized = serializeState(external.state);
    if (serialized === saved) {
      if (!dirty) update({ issue: "", blocked: false, original: null });
      return false;
    }
    if (dirty) {
      captureSafeEvent("prototype_error", "storage_conflict");
      update({
        issue:
          "Dane zmieniły się w innej karcie, a ta karta ma niezapisane zmiany. Wyeksportuj je w ustawieniach przed importem lub resetem. Zapis został wstrzymany.",
        blocked: true,
        original: serialized,
      });
      return false;
    }
    saved = serialized;
    update({ state: external.state, issue: "", error: "", blocked: false, original: null });
    return true;
  }
  function commit(next: State, replace = false, requirePersistence = false): boolean {
    if (!requirePersistence) {
      dirty = true;
      update({ state: next, error: "", unsaved: true });
    }
    if (snapshot.blocked && !replace) return false;
    try {
      saveState(storage(), next);
      saved = serializeState(next);
      dirty = false;
      reportedWriteFailure = false;
      update({ state: next, error: "", issue: "", blocked: false, original: null, unsaved: false });
      return true;
    } catch (error) {
      update({ issue: (error as Error).message });
      if (!reportedWriteFailure) captureSafeEvent("prototype_error", "storage_write");
      reportedWriteFailure = true;
      return false;
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sync,
    run(action: Action) {
      if (sync()) {
        update({
          error:
            "Dane zostały zaktualizowane w innej karcie. Sprawdź aktualny widok i ponów zmianę.",
        });
        return false;
      }
      try {
        const persisted = commit(
          transition(snapshot.state, action),
          false,
          action.type === "submit",
        );
        if (action.type === "submit" && !persisted) {
          update({
            error:
              "Nie zapisano aplikacji. Zachowaj odpowiedź przez eksport w ustawieniach danych i zgłoś problem osobie zapraszającej do testu.",
          });
          return false;
        }
        if (persisted && action.type === "submit") {
          recordResearchCheckpoint("application_submitted");
          captureSafeEvent("application_submitted");
        }
        if (persisted && action.type === "project_confirm") {
          recordResearchCheckpoint("project_confirmed");
          captureSafeEvent("project_card_confirmed");
        }
        return true;
      } catch (error) {
        captureSafeEvent("prototype_error", "invalid_action");
        update({
          error:
            error instanceof Error && error.name !== "ZodError"
              ? error.message
              : "Sprawdź poprawność i długość wprowadzonych danych.",
        });
        return false;
      }
    },
    importState(raw: string) {
      try {
        commit(parseState(raw), true);
        return true;
      } catch (error) {
        update({ error: (error as Error).message });
        return false;
      }
    },
    clearError: () => update({ error: "" }),
    reset: () => commit(initialState(), true),
  };
}
