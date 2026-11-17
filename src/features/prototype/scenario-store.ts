import { initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, serializeState, type StoragePort } from "./storage";

/** Shared scenario controller; browser events only request a read, never a write. */
export function createScenarioStore(storage: () => StoragePort | null) {
  const loaded = readState(storage());
  let snapshot = { ...loaded, error: "" };
  let saved = serializeState(loaded.state);
  let dirty = false;
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
  function commit(next: State, replace = false) {
    dirty = true;
    update({ state: next, error: "" });
    if (snapshot.blocked && !replace) return;
    try {
      saveState(storage(), next);
      saved = serializeState(next);
      dirty = false;
      update({ issue: "", blocked: false, original: null });
    } catch (error) {
      update({ issue: (error as Error).message });
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
        commit(transition(snapshot.state, action));
        return true;
      } catch (error) {
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
