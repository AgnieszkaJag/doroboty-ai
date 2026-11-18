import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RESEARCH_SESSION_KEY,
  readResearchRun,
  startResearchRun,
  recordResearchCheckpoint,
  finishResearchRun,
  researchSummary,
  clearResearchRun,
} from "./research-session";

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  readResearchRun();
});
afterEach(() => vi.unstubAllGlobals());

describe("optional research runs", () => {
  it("persists a random code across reads without copying scenario text", () => {
    expect(readResearchRun()).toBeNull();
    const run = startResearchRun();
    expect(run.code).toMatch(/^[0-9a-f-]{36}$/);
    recordResearchCheckpoint("project_confirmed");
    const first = readResearchRun()!;
    recordResearchCheckpoint("project_confirmed");
    expect(readResearchRun()).toEqual(first);
    recordResearchCheckpoint("application_submitted");
    const completed = finishResearchRun("completed")!;
    expect(completed.code).toBe(run.code);
    expect(researchSummary(completed)).toContain("Zakończenie: ukończono");
    expect(Object.keys(JSON.parse(values.get(RESEARCH_SESSION_KEY)!)).sort()).toEqual(
      ["code", "startedAt", "checkpoints", "outcome"].sort(),
    );
    expect(startResearchRun().code).not.toBe(run.code);
  });
  it("ignores invalid codes and checkpoints instead of propagating imported text", () => {
    values.set(
      RESEARCH_SESSION_KEY,
      JSON.stringify({ code: "private text", startedAt: "today", checkpoints: {} }),
    );
    expect(readResearchRun()).toBeNull();
    recordResearchCheckpoint("application_submitted");
    expect(finishResearchRun("blocked")).toBeNull();
  });
  it("does not require working session storage", () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("blocked");
      },
    });
    expect(() => startResearchRun()).not.toThrow();
    expect(readResearchRun()?.code).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("lets an existing run opt out without retaining its code in the tab", () => {
    startResearchRun();
    clearResearchRun();
    expect(readResearchRun()).toBeNull();
    expect(values.has(RESEARCH_SESSION_KEY)).toBe(false);
    expect(startResearchRun().code).toMatch(/^[0-9a-f-]{36}$/);
  });
});
