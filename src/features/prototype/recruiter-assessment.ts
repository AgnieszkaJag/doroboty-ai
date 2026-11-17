import { z } from "zod";
import type { Application, State } from "./model";
import {
  analyzeRoleSources,
  projectEvidence,
  type RoleObservation,
  type RoleContext,
} from "./recruiter-project-report";

const reference = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
export const rubricCriteriaSchema = z
  .array(z.string().trim().min(10).max(1000))
  .min(1)
  .max(5)
  .refine(
    (criteria) =>
      new Set(criteria.map((value) => value.toLocaleLowerCase("pl"))).size === criteria.length,
    "Każde kryterium musi być inne.",
  );
export const roleRubricSchema = z.object({
  jobId: reference,
  companyId: reference,
  version: z.number().int().min(1).max(100000),
  criteria: rubricCriteriaSchema,
  role: z.object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().max(12000),
    description: z.string().max(12000),
  }),
  confirmedAt: z.iso.datetime(),
  confirmedBy: reference,
});
export type RoleRubric = z.infer<typeof roleRubricSchema>;
export type Coverage = {
  percent: number;
  points: number;
  maximum: number;
  observations: RoleObservation[];
};
const points = (item: RoleObservation) =>
  item.status === "personal" ? 2 : item.status === "related" ? 1 : 0;
function coverage(observations: RoleObservation[]): Coverage {
  const sum = observations.reduce((total, item) => total + points(item), 0);
  const maximum = observations.length * 2;
  return { percent: Math.round((sum / maximum) * 100), points: sum, maximum, observations };
}
export function rubricFor(state: Pick<State, "roleRubrics">, jobId: string) {
  return state.roleRubrics.find((item) => item.jobId === jobId);
}
export function rubricIsCurrent(rubric: RoleRubric, role: RoleContext) {
  return (
    rubric.role.title === role.title &&
    rubric.role.summary === role.summary &&
    rubric.role.description === role.description
  );
}
/** Current, version-labelled material coverage, never the legacy persona score. */
export function assessApplication(application: Application, rubric?: RoleRubric) {
  if (!rubric || rubric.jobId !== application.jobId || rubric.companyId !== application.companyId)
    return null;
  const projectSources = application.projectCard ? projectEvidence(application.projectCard) : [];
  const project = application.projectCard
    ? coverage(analyzeRoleSources(rubric.criteria, projectSources))
    : null;
  const overall = coverage(
    analyzeRoleSources(rubric.criteria, [
      ...projectSources,
      { source: "CV z aplikacji", quote: application.cv, personal: true },
      { source: "Odpowiedź w aplikacji", quote: application.answer, personal: true },
    ]),
  );
  const described = overall.observations.filter((item) => item.status === "personal").length;
  const related = overall.observations.filter((item) => item.status === "related").length;
  return {
    overall,
    project,
    rubric,
    summary: `${described} z ${rubric.criteria.length} oczekiwań ma powiązany przykład własnej pracy${related ? `; dla ${related} jest częściowy opis` : ""}.`,
  };
}
export function recruiterListPath(params: URLSearchParams) {
  const next = new URLSearchParams();
  for (const key of ["oferta", "q"]) if (params.get(key)) next.set(key, params.get(key)!);
  return `/app/kandydaci${next.size ? `?${next}` : ""}`;
}
export function recruiterDetailPath(
  applicationId: string,
  params: URLSearchParams,
  analysis = false,
) {
  const next = new URLSearchParams(recruiterListPath(params).split("?")[1]);
  if (analysis) next.set("sekcja", "analysis");
  return `/app/kandydaci/${encodeURIComponent(applicationId)}${next.size ? `?${next}` : ""}`;
}
