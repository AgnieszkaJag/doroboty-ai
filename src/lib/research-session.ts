import { z } from "zod";

export const RESEARCH_SESSION_KEY = "doroboty-research-run-v1";
const checkpointSchema = z.enum(["project_confirmed", "application_submitted"]);
const runSchema = z.object({
  code: z.uuid(),
  startedAt: z.iso.datetime(),
  checkpoints: z.partialRecord(checkpointSchema, z.iso.datetime()),
  outcome: z.enum(["completed", "blocked"]).optional(),
});
export type ResearchRun = z.infer<typeof runSchema>;
let memory: ResearchRun | null = null;
let optedOut = false;

export function readResearchRun(): ResearchRun | null {
  if (optedOut) return null;
  try {
    const raw = window.sessionStorage.getItem(RESEARCH_SESSION_KEY);
    const parsed = raw ? runSchema.safeParse(JSON.parse(raw)) : null;
    memory = parsed?.success ? parsed.data : null;
  } catch {
    // The optional research code must not prevent a test when storage is unavailable.
  }
  return memory;
}

function save(run: ResearchRun): ResearchRun {
  memory = run;
  try {
    window.sessionStorage.setItem(RESEARCH_SESSION_KEY, JSON.stringify(run));
  } catch {
    // Retain the code for this page lifetime only; scenario persistence is separate.
  }
  return run;
}

export function startResearchRun(): ResearchRun {
  optedOut = false;
  return save({ code: crypto.randomUUID(), startedAt: new Date().toISOString(), checkpoints: {} });
}

export function clearResearchRun(): void {
  memory = null;
  optedOut = true;
  try {
    window.sessionStorage.removeItem(RESEARCH_SESSION_KEY);
  } catch {
    // Keep the optional code disabled in memory even if storage rejects removal.
  }
}

export function recordResearchCheckpoint(checkpoint: z.infer<typeof checkpointSchema>): void {
  const run = readResearchRun();
  if (run && !run.outcome && !run.checkpoints[checkpoint])
    save({ ...run, checkpoints: { ...run.checkpoints, [checkpoint]: new Date().toISOString() } });
}

export function finishResearchRun(
  outcome: NonNullable<ResearchRun["outcome"]>,
): ResearchRun | null {
  const run = readResearchRun();
  return run ? save({ ...run, outcome }) : null;
}

export function researchSummary(run: ResearchRun): string {
  return [
    "DoRoboty.ai — podsumowanie próby",
    `Kod: ${run.code}`,
    `Start (UTC): ${run.startedAt}`,
    `Potwierdzenie karty: ${run.checkpoints.project_confirmed ?? "nie zapisano"}`,
    `Próbna aplikacja: ${run.checkpoints.application_submitted ?? "nie zapisano"}`,
    `Zakończenie: ${run.outcome === "completed" ? "ukończono" : run.outcome === "blocked" ? "problem" : "w toku"}`,
    "Podsumowanie nie zawiera odpowiedzi, opisu projektu ani danych profilu.",
  ].join("\n");
}
