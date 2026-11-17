import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const answer = z.string().max(6000);
export const projectAnswersSchema = z.object({
  title: z.string().max(160),
  context: answer,
  personal: answer,
  teamwork: answer,
  outcome: answer,
});
export type ProjectAnswers = z.infer<typeof projectAnswersSchema>;
export const projectAreas = ["context", "personal", "teamwork", "decisions", "outcome"] as const;
export type ProjectArea = (typeof projectAreas)[number];
// Compatibility only: historical answers remain valid sources for saved reports.
const followUpSchema = z.object({
  area: z.enum(projectAreas),
  question: z.string().min(1).max(500),
  answer,
  skipped: z.boolean(),
});
export type ProjectFollowUp = z.infer<typeof followUpSchema>;
export const projectAnalysisSchema = z.object({
  engine: z.literal("local-completeness-v1"),
  checks: z
    .array(
      z.object({
        area: z.enum(projectAreas),
        label: z.string().max(100),
        status: z.enum(["described", "partial"]),
        quote: z.string().max(20000),
        note: z.string().max(500),
        question: z.string().max(500),
      }),
    )
    .length(5),
});
export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>;
export const projectInputSchema = projectAnswersSchema.extend({
  id: identifier,
  followUps: z.array(followUpSchema).max(2),
  workflow: z.enum(["edit", "followups", "preview"]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;
export const projectCardSchema = projectInputSchema
  .extend({
    candidateId: identifier,
    status: z.enum(["draft", "confirmed"]),
    followUpsAsked: z.boolean(),
    updatedAt: z.iso.datetime(),
    analysis: projectAnalysisSchema.optional(),
  })
  .superRefine((card, ctx) => {
    if (new Set(card.followUps.map((item) => item.area)).size !== card.followUps.length)
      ctx.addIssue({ code: "custom", message: "Duplicate project follow-up" });
    if (
      card.analysis &&
      JSON.stringify(card.analysis) !==
        JSON.stringify(projectAnalysisSchema.parse(analyzeProject(card, card.followUps)))
    )
      ctx.addIssue({ code: "custom", message: "Project analysis does not match its source" });
    if (
      card.status === "confirmed" &&
      (!projectComplete(card) || !card.analysis || card.workflow !== "preview")
    )
      ctx.addIssue({ code: "custom", message: "Unreviewed confirmed project" });
  });
export type ProjectCard = z.infer<typeof projectCardSchema>;
export const emptyProject: ProjectAnswers = {
  title: "",
  context: "",
  personal: "",
  teamwork: "",
  outcome: "",
};
export function newProjectInput(id: string): ProjectInput {
  return { id, ...emptyProject, followUps: [], workflow: "edit" };
}
export function projectComplete(value: ProjectAnswers) {
  return Object.values(projectAnswersSchema.parse(value)).every((item) => item.trim().length > 0);
}
export function projectSource(value: ProjectInput) {
  return JSON.stringify([
    value.title,
    value.context,
    value.personal,
    value.teamwork,
    value.outcome,
    value.followUps,
  ]);
}
const prompts: Record<ProjectArea, string> = {
  context: "Dla kogo powstał projekt i jaki konkretny problem miał rozwiązać?",
  personal:
    "Wskaż jedno działanie, które wykonałaś lub wykonałeś osobiście. Co dokładnie było Twoją pracą i za co odpowiadasz?",
  teamwork:
    "Co wykonały pozostałe osoby i gdzie kończyła się Twoja odpowiedzialność? Jeśli projekt był samodzielny, napisz to wprost.",
  decisions:
    "Jaką decyzję podjęłaś lub podjąłeś samodzielnie i dlaczego? Jaką alternatywę rozważasz lub rozważano?",
  outcome:
    "Na czym opierasz rezultat: pomiarze, obserwacji lub informacji od odbiorcy? Oddziel własny efekt od wyniku zespołu. Możesz napisać, że nie masz tych danych.",
};

/** Deterministic narrative hints, never verification of a claim, skill or role fit. */
export function analyzeProject(
  value: ProjectAnswers,
  followUps: ProjectFollowUp[] = [],
): ProjectAnalysis {
  const source = (area: ProjectArea, base: string) =>
    [
      base,
      ...followUps.filter((item) => item.area === area && !item.skipped).map((item) => item.answer),
    ]
      .filter(Boolean)
      .join("\n\n");
  const context = source("context", value.context);
  const personal = source("personal", value.personal);
  const teamwork = source("teamwork", value.teamwork);
  const decisions = source("decisions", personal);
  const outcome = source("outcome", value.outcome);
  const unknown = /(?:nie (?:mam|znam|wiem|posiadam)|brak (?:danych|pomiar)|nie mierz|nie zmierz)/i;
  const rows: Array<{
    area: ProjectArea;
    label: string;
    quote: string;
    complete: boolean;
    note: string;
  }> = [
    {
      area: "context",
      label: "Kontekst i cel",
      quote: context,
      complete: context.trim().length >= 40,
      note: "Warto wskazać odbiorcę, cel i swoją rolę w projekcie.",
    },
    {
      area: "personal",
      label: "Własny wkład",
      quote: personal,
      complete:
        personal.trim().length >= 50 &&
        /(?:samodzielnie|odpowiadam|odpowiada(?:łam|łem)|moja |moim |osobiście|(?:zaprojektowa|przeprowadzi|wykona|wdroży|zbudowa|opracowa|napisa|stworzy|przygotowa|przeanalizowa|prowadzi|zbada|przetestowa|wybra|zdecydowa|zrobi)(?:łam|łem)|wykonuję|projektuję|prowadzę|tworzę|wdrażam|analizuję)/i.test(
          personal,
        ),
      note: "Warto wskazać własne działanie i zakres odpowiedzialności.",
    },
    {
      area: "teamwork",
      label: "Podział pracy",
      quote: teamwork,
      complete:
        teamwork.trim().length >= 30 ||
        /(?:samodzielnie|bez zespołu|w pojedynkę|jednoosobow)/i.test(teamwork),
      note: "Warto opisać pracę innych osób lub zaznaczyć, że projekt był samodzielny.",
    },
    {
      area: "decisions",
      label: "Decyzje i uzasadnienie",
      quote: decisions,
      complete:
        decisions.trim().length >= 50 &&
        /(?:ponieważ|dlatego|żeby|aby |bo |ze względu|zamiast)/i.test(decisions),
      note: "Warto podać przykład własnej decyzji i wyjaśnić jej powód.",
    },
    {
      area: "outcome",
      label: "Rezultat i jego podstawa",
      quote: outcome,
      complete:
        outcome.trim().length >= 45 &&
        !unknown.test(outcome) &&
        /(?:pomiar|zmierz|porówn|danych|metry|test|anality|obserw|opini|informac|raport|badani|ankiet|użytkown|klient|odbiorc)/i.test(
          outcome,
        ),
      note: "Warto wskazać źródło rezultatu. Brak danych pozostaje jawną luką do rozmowy.",
    },
  ];
  return {
    engine: "local-completeness-v1",
    checks: rows.map(({ area, label, quote, complete, note }) => ({
      area,
      label,
      quote,
      status: complete ? "described" : "partial",
      note: complete
        ? "W opisie znajduje się fragment dotyczący tego obszaru. To deklaracja kandydata do omówienia na rozmowie."
        : note,
      question: prompts[area],
    })),
  };
}
