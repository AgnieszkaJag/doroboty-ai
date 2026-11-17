import { z } from "zod";
import {
  projectCardSchema,
  projectInputSchema,
  projectComplete,
  projectSource,
  analyzeProject,
  type ProjectInput,
} from "./project-card-model";
import marketplace from "./data/marketplace.json" with { type: "json" };
import people from "./data/people.json" with { type: "json" };
import type { JobWithCompany } from "@/features/jobs/types";
import { roleRubricSchema, rubricCriteriaSchema } from "./recruiter-assessment";

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const shortText = z.string().trim().min(1).max(200);
const text = z.string().trim().max(12000);
export const MIN_APPLICATION_ANSWER_LENGTH = 20;
const companySchema = z.object({
  id,
  slug: id,
  name: shortText,
  summary: text,
  description: text,
  websiteUrl: z.string().max(500),
  location: shortText,
  sizeLabel: shortText,
  logoUrl: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional(),
});
export const jobSchema = z
  .object({
    id,
    slug: id,
    companyId: id,
    title: shortText,
    summary: text.min(10),
    description: text.min(30),
    category: z.enum(["build", "apply", "lead"]),
    function: z.enum(["product", "engineering", "data", "design", "marketing", "operations"]),
    remoteStatus: z.enum(["onsite", "hybrid", "remote"]),
    locations: z.array(shortText).min(1).max(10),
    coordinates: z
      .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
      .optional(),
    seniority: z.enum(["junior", "mid", "senior", "lead"]),
    contract: z.enum(["employment", "b2b", "mandate"]),
    salaryMin: z.number().nonnegative().optional(),
    salaryMax: z.number().nonnegative().optional(),
    salaryCurrency: z.enum(["PLN", "EUR"]).optional(),
    salaryPeriod: z.enum(["month", "year"]).optional(),
    salaryKind: z.enum(["gross", "net"]).optional(),
    publicationStatus: z.enum(["draft", "review", "published", "hidden", "expired", "archived"]),
    publishedAt: z.iso.datetime(),
    expiryAt: z.iso.datetime(),
    verificationStatus: z.enum(["unverified", "editorial", "employer_verified"]),
    sourceBrief: text.optional(),
    generatedDescription: text.optional(),
  })
  .refine(
    (job) =>
      job.salaryMin === undefined || job.salaryMax === undefined || job.salaryMin <= job.salaryMax,
    { path: ["salaryMax"], message: "Salary maximum must not be below minimum" },
  );
export const profileSchema = z.object({
  name: shortText,
  headline: shortText,
  bio: text,
  location: shortText,
});
const personSchema = profileSchema.extend({
  id,
  role: z.enum(["candidate", "employer", "operator"]),
  companyId: id.optional(),
  cv: text,
  exampleScore: z.number().int().min(0).max(100),
  exampleSummary: text,
});
export const stages = [
  "submitted",
  "reviewed",
  "interview_invited",
  "first_conversation_held",
  "continued",
  "rejected",
  "withdrawn",
  "hired",
] as const;
export type Stage = (typeof stages)[number];
export const stageLabels: Record<Stage, string> = {
  submitted: "Aplikacja wysłana",
  reviewed: "W przeglądzie",
  interview_invited: "Zaproszenie na rozmowę",
  first_conversation_held: "Pierwsza rozmowa odbyta",
  continued: "Kolejny etap",
  rejected: "Proces zakończony",
  withdrawn: "Wycofana",
  hired: "Zatrudnienie",
};
export const nextStages: Record<Stage, Stage[]> = {
  submitted: ["reviewed", "rejected"],
  reviewed: ["interview_invited", "rejected"],
  interview_invited: ["first_conversation_held", "rejected"],
  first_conversation_held: ["continued", "rejected"],
  continued: ["hired", "rejected"],
  rejected: [],
  withdrawn: [],
  hired: [],
};
const applicationSchema = z.object({
  id,
  candidateId: id,
  jobId: id,
  companyId: id,
  jobTitle: shortText,
  roleSnapshot: z.object({ title: shortText, summary: text, description: text }).optional(),
  candidateName: shortText,
  candidateSnapshot: profileSchema.optional(),
  projectCard: projectCardSchema.optional(),
  cv: text.min(20),
  answer: text.min(MIN_APPLICATION_ANSWER_LENGTH),
  sourceNotes: text,
  generatedAnswer: text,
  score: z.number().int().min(0).max(100),
  summary: text,
  stage: z.enum(stages),
  events: z
    .array(z.object({ stage: z.enum(stages), at: z.iso.datetime(), note: text }))
    .min(1)
    .max(30),
});
const draftSchema = z.object({
  candidateId: id,
  jobId: id,
  notes: text,
  generated: text,
  answer: text,
  projectCardId: id.optional(),
});
export const stateSchema = z
  .object({
    version: z.literal(1),
    activePersonId: id.nullable(),
    companies: z.array(companySchema).min(1).max(200),
    jobs: z.array(jobSchema).min(1).max(1000),
    people: z.array(personSchema).min(1).max(100),
    applications: z.array(applicationSchema).max(2000),
    saved: z.array(z.object({ candidateId: id, jobId: id })).max(5000),
    drafts: z.array(draftSchema).max(1000),
    projectCards: z.array(projectCardSchema).max(1000).default([]),
    deletedProjectCards: z.array(projectCardSchema).max(1000).default([]),
    roleRubrics: z.array(roleRubricSchema).max(1000).default([]),
  })
  .superRefine((s, ctx) => {
    const problem = (message: string) => ctx.addIssue({ code: "custom", message });
    for (const list of [
      s.companies,
      s.jobs,
      s.people,
      s.applications,
      [...s.projectCards, ...s.deletedProjectCards],
    ]) {
      if (new Set(list.map((x) => x.id)).size !== list.length) problem("Duplicate identifiers");
    }
    if (
      new Set(s.jobs.map((x) => x.slug)).size !== s.jobs.length ||
      new Set(s.companies.map((x) => x.slug)).size !== s.companies.length
    )
      problem("Duplicate slugs");
    const companyIds = new Set(s.companies.map((x) => x.id));
    const jobs = new Map(s.jobs.map((x) => [x.id, x]));
    const candidates = new Set(s.people.filter((x) => x.role === "candidate").map((x) => x.id));
    if (s.activePersonId !== null && !s.people.some((x) => x.id === s.activePersonId))
      problem("Unknown active person");
    for (const p of s.people)
      if (p.role === "employer" && (!p.companyId || !companyIds.has(p.companyId)))
        problem("Unknown employer company");
    for (const j of s.jobs) if (!companyIds.has(j.companyId)) problem("Unknown job company");
    const rubricJobs = new Set<string>();
    for (const rubric of s.roleRubrics) {
      const author = s.people.find((item) => item.id === rubric.confirmedBy);
      if (
        rubricJobs.has(rubric.jobId) ||
        jobs.get(rubric.jobId)?.companyId !== rubric.companyId ||
        author?.role !== "employer" ||
        author.companyId !== rubric.companyId
      )
        problem("Invalid role rubric reference");
      rubricJobs.add(rubric.jobId);
    }
    for (const card of [...s.projectCards, ...s.deletedProjectCards])
      if (!candidates.has(card.candidateId)) problem("Unknown project owner");
    const keys = new Set<string>();
    for (const a of s.applications) {
      const key = `${a.candidateId}:${a.jobId}`;
      if (
        !candidates.has(a.candidateId) ||
        jobs.get(a.jobId)?.companyId !== a.companyId ||
        keys.has(key)
      )
        problem("Invalid application reference");
      if (
        a.projectCard &&
        (a.projectCard.candidateId !== a.candidateId || a.projectCard.status !== "confirmed")
      )
        problem("Invalid project snapshot");
      if (a.candidateSnapshot && a.candidateSnapshot.name !== a.candidateName)
        problem("Invalid candidate profile snapshot");
      keys.add(key);
      if (a.events[0]?.stage !== "submitted" || a.events.at(-1)?.stage !== a.stage)
        problem("Invalid application history");
      for (let i = 1; i < a.events.length; i++) {
        const before = a.events[i - 1];
        const after = a.events[i];
        if (!(
          nextStages[before.stage].includes(after.stage) ||
          (after.stage === "withdrawn" &&
            !["hired", "rejected", "withdrawn"].includes(before.stage))
        ))
          problem("Invalid stage transition");
        if (after.at < before.at) problem("Invalid event order");
      }
    }
    for (const list of [s.saved, s.drafts]) {
      const pairs = new Set<string>();
      for (const item of list) {
        const key = `${item.candidateId}:${item.jobId}`;
        if (!candidates.has(item.candidateId) || !jobs.has(item.jobId) || pairs.has(key))
          problem("Invalid candidate/job reference");
        pairs.add(key);
      }
    }
  });
export type State = z.infer<typeof stateSchema>;
export type Person = State["people"][number];
export type Application = State["applications"][number];
export type Action =
  | { type: "select_person"; id: string | null }
  | { type: "project_save"; value: ProjectInput; mode: "draft" | "analyze" | "preview" }
  | { type: "project_confirm"; id: string }
  | { type: "project_delete"; id: string }
  | { type: "project_restore"; id: string }
  | { type: "profile"; value: z.infer<typeof profileSchema> }
  | { type: "toggle_saved"; jobId: string }
  | {
      type: "draft";
      jobId: string;
      notes: string;
      generated: string;
      answer: string;
      projectCardId?: string;
    }
  | {
      type: "submit";
      jobId: string;
      notes: string;
      generated: string;
      answer: string;
      consent: boolean;
      projectCardId?: string;
    }
  | { type: "stage"; applicationId: string; stage: Stage; note: string }
  | { type: "withdraw"; applicationId: string }
  | { type: "publish"; job: z.infer<typeof jobSchema> }
  | { type: "company"; name: string; description: string }
  | RubricAction;
// A rubric is stored only after explicit employer confirmation.
export type RubricAction = { type: "rubric_confirm"; jobId: string; criteria: string[] };

export function initialState(): State {
  const state = stateSchema.parse({
    version: 1,
    activePersonId: null,
    ...marketplace,
    people,
    applications: [],
    saved: [],
    drafts: [],
  });
  const bob = state.people.find((x) => x.id === "candidate-marek")!;
  const job = state.jobs[0];
  state.applications.push({
    id: "application-example",
    candidateId: bob.id,
    jobId: job.id,
    companyId: job.companyId,
    jobTitle: job.title,
    candidateName: bob.name,
    cv: bob.cv,
    answer:
      "Pracowałem nad automatyzacją obsługi zgłoszeń. Poprowadziłem badania z użytkownikami i wdrożenie, które skróciło czas odpowiedzi o 25%. Chętnie opowiem o decyzjach i ograniczeniach tego projektu.",
    sourceNotes: "",
    generatedAnswer: "",
    score: bob.exampleScore,
    summary: bob.exampleSummary,
    stage: "submitted",
    events: [{ stage: "submitted", at: "2026-11-02T09:00:00.000Z", note: "" }],
  });
  return stateSchema.parse(state);
}
export function publishedJobs(state: State): JobWithCompany[] {
  return state.jobs
    .filter((x) => x.publicationStatus === "published")
    .map((job) => ({ ...job, company: state.companies.find((x) => x.id === job.companyId)! }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function currentPerson(state: State) {
  return state.people.find((x) => x.id === state.activePersonId);
}
export function transition(
  state: State,
  action: Action,
  now = new Date().toISOString(),
  newId: string = crypto.randomUUID(),
): State {
  const s = structuredClone(state);
  const person = currentPerson(s);
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const candidate = () => {
    if (person?.role !== "candidate") return fail("Wybierz profil kandydata.");
    return person;
  };
  const employer = () => {
    if (person?.role !== "employer") return fail("Wybierz profil pracodawcy.");
    return person;
  };
  if (action.type === "rubric_confirm") {
    const p = employer();
    const job = s.jobs.find((item) => item.id === action.jobId && item.companyId === p.companyId);
    if (!job) fail("Oferta nie jest dostępna dla tej firmy.");
    const criteria = rubricCriteriaSchema.parse(action.criteria);
    const previous = s.roleRubrics.find((item) => item.jobId === action.jobId);
    const rubric = roleRubricSchema.parse({
      jobId: job!.id,
      companyId: job!.companyId,
      version: (previous?.version ?? 0) + 1,
      criteria,
      role: { title: job!.title, summary: job!.summary, description: job!.description },
      confirmedAt: now,
      confirmedBy: p.id,
    });
    s.roleRubrics = [...s.roleRubrics.filter((item) => item.jobId !== action.jobId), rubric];
  } else if (action.type === "select_person") {
    if (action.id !== null && !s.people.some((x) => x.id === action.id))
      fail("Nie znaleziono osoby.");
    s.activePersonId = action.id;
  } else if (action.type === "project_save") {
    const p = candidate();
    const value = projectInputSchema.parse(action.value);
    const existing = s.projectCards.find((card) => card.id === value.id);
    if (s.deletedProjectCards.some((card) => card.id === value.id))
      fail("Projekt został usunięty. Przywróć go z profilu przed edycją.");
    if (existing && existing.candidateId !== p.id) fail("Ta karta należy do innej osoby.");
    // Preserve legacy prompt identities while allowing their existing answers to be edited.
    const issued = existing?.followUps ?? [];
    if (
      value.followUps.length !== issued.length ||
      value.followUps.some(
        (item, index) =>
          item.area !== issued[index]?.area || item.question !== issued[index]?.question,
      )
    )
      fail("Nie można zmienić pytań asystenta.");
    const unchanged = existing && projectSource(value) === projectSource(existing);
    const card = projectCardSchema.parse({
      ...value,
      candidateId: p.id,
      updatedAt: now,
      status: unchanged && value.workflow === "preview" ? existing.status : "draft",
      followUpsAsked: existing?.followUpsAsked ?? false,
      analysis: unchanged ? existing.analysis : undefined,
      // Confirmed cards stay in preview until an explicit edit action.
      workflow: value.workflow === "followups" ? "edit" : value.workflow,
    });
    if (action.mode !== "draft") {
      if (!projectComplete(value)) fail("Uzupełnij nazwę projektu i odpowiedzi na trzy pytania.");
      card.analysis = analyzeProject(card, card.followUps);
      card.status = "draft";
      card.workflow = "preview";
    }
    if (existing) s.projectCards[s.projectCards.indexOf(existing)] = card;
    else s.projectCards.unshift(card);
  } else if (action.type === "project_confirm") {
    const p = candidate();
    const card = s.projectCards.find((item) => item.id === action.id && item.candidateId === p.id);
    if (!card || !card.analysis || card.workflow !== "preview" || !projectComplete(card))
      fail("Sprawdź aktualny opis i otwórz podgląd przed potwierdzeniem.");
    card!.status = "confirmed";
    card!.updatedAt = now;
  } else if (action.type === "project_delete") {
    const p = candidate();
    const index = s.projectCards.findIndex(
      (card) => card.id === action.id && card.candidateId === p.id,
    );
    if (index < 0) fail("Nie znaleziono Twojego projektu.");
    const [card] = s.projectCards.splice(index, 1);
    s.deletedProjectCards.unshift(card);
    for (const draft of s.drafts)
      if (draft.candidateId === p.id && draft.projectCardId === action.id)
        delete draft.projectCardId;
  } else if (action.type === "project_restore") {
    const p = candidate();
    const index = s.deletedProjectCards.findIndex(
      (card) => card.id === action.id && card.candidateId === p.id,
    );
    if (index < 0) fail("Nie znaleziono Twojego usuniętego projektu.");
    const [card] = s.deletedProjectCards.splice(index, 1);
    s.projectCards.unshift(card);
  } else if (action.type === "profile")
    Object.assign(candidate(), profileSchema.parse(action.value));
  else if (action.type === "toggle_saved") {
    const p = candidate();
    if (!s.jobs.some((x) => x.id === action.jobId)) fail("Nie znaleziono oferty.");
    const index = s.saved.findIndex((x) => x.candidateId === p.id && x.jobId === action.jobId);
    if (index >= 0) s.saved.splice(index, 1);
    else s.saved.push({ candidateId: p.id, jobId: action.jobId });
  } else if (action.type === "draft") {
    const p = candidate();
    const draft = draftSchema.parse({ candidateId: p.id, ...action });
    s.drafts = s.drafts.filter((x) => !(x.candidateId === p.id && x.jobId === action.jobId));
    s.drafts.push(draft);
  } else if (action.type === "submit") {
    const p = candidate();
    const job = s.jobs.find((x) => x.id === action.jobId && x.publicationStatus === "published");
    if (!job) return fail("Oferta nie jest dostępna.");
    if (!action.consent) fail("Zatwierdź treść i zgodę na przesłanie aplikacji.");
    if (s.applications.some((x) => x.candidateId === p.id && x.jobId === job.id))
      fail("Aplikacja na tę ofertę została już wysłana.");
    const projectCard = action.projectCardId
      ? s.projectCards.find(
          (card) =>
            card.id === action.projectCardId &&
            card.candidateId === p.id &&
            card.status === "confirmed",
        )
      : undefined;
    if (action.projectCardId && !projectCard)
      fail("Wybierz potwierdzoną kartę ze swojego profilu.");
    s.applications.push(
      applicationSchema.parse({
        id: newId,
        candidateId: p.id,
        jobId: job.id,
        companyId: job.companyId,
        jobTitle: job.title,
        roleSnapshot: { title: job.title, summary: job.summary, description: job.description },
        candidateName: p.name,
        candidateSnapshot: profileSchema.parse(p),
        projectCard,
        cv: p.cv,
        answer: action.answer,
        sourceNotes: action.notes,
        generatedAnswer: action.generated,
        score: p.exampleScore,
        summary: p.exampleSummary,
        stage: "submitted",
        events: [{ stage: "submitted", at: now, note: "" }],
      }),
    );
    s.drafts = s.drafts.filter((x) => !(x.candidateId === p.id && x.jobId === job.id));
  } else if (action.type === "stage" || action.type === "withdraw") {
    const application = s.applications.find((x) => x.id === action.applicationId);
    if (!application) return fail("Nie znaleziono aplikacji.");
    const stage = action.type === "withdraw" ? "withdrawn" : action.stage;
    if (action.type === "withdraw") {
      const p = candidate();
      if (
        application.candidateId !== p.id ||
        ["hired", "rejected", "withdrawn"].includes(application.stage)
      )
        fail("Nie można wycofać tej aplikacji.");
    } else {
      const p = employer();
      if (application.companyId !== p.companyId || !nextStages[application.stage].includes(stage))
        fail("Ta zmiana etapu nie jest dostępna.");
    }
    application.stage = stage;
    application.events.push({ stage, at: now, note: action.type === "stage" ? action.note : "" });
  } else if (action.type === "publish") {
    const p = employer();
    const job = jobSchema.parse(action.job);
    if (job.companyId !== p.companyId) fail("Wybierz ofertę własnej firmy.");
    const index = s.jobs.findIndex((x) => x.id === job.id);
    if (index >= 0) {
      if (s.jobs[index].companyId !== p.companyId) fail("Nie można zmienić tej oferty.");
      s.jobs[index] = job;
    } else s.jobs.unshift(job);
  } else if (action.type === "company") {
    const p = employer();
    Object.assign(
      s.companies.find((x) => x.id === p.companyId)!,
      { name: shortText.parse(action.name), description: text.parse(action.description) },
    );
  }
  return stateSchema.parse(s);
}
