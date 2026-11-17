import { analyzeProject, type ProjectCard } from "./project-card-model";

export type RoleContext = { title: string; summary: string; description: string };
export type Evidence = { source: string; quote: string; personal: boolean };
export type RoleObservation = {
  expectation: string;
  status: "personal" | "related" | "missing";
  evidence?: Evidence;
  note: string;
  question: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const sentences = (value: string) =>
  value
    .match(/[^.!?\n]+(?:[.!?](?=\s|$)|$)/g)
    ?.map((line) => line.trim())
    .filter(Boolean) ?? [];
const excerpt = (value: string) =>
  value.length > 420 ? `${value.slice(0, 420).trimEnd()}…` : value;

/** Textual signals only: these rules do not verify experience or infer competence. */
const topics = [
  /discovery|badan|wywiad|rozmow.*uzytk|obserwac.*prac/,
  /eksperyment|pilot|hipotez|prototyp/,
  /priorytet|zaleznosc|ogranicza.*zakres/,
  /ewaluac|zestaw.*(?:test|kontrol)|regresj/,
  /integrac|\bapi\b|kontrakt.*api/,
  /wdroz|produkcyjn|utrzym|incydent|awari/,
  /pomiar|mierzy|mierzyl|zmierz|porown|punkt.*wyjsc|czas.*obslug/,
  /projektow|design|interfejs|przeplyw|figma|komponent/,
  /decyzj|kompromis|alternatyw|poniewaz|dlatego/,
  /architektur|przeglad.*kod/,
  /wspolprac|z zespolem|inzynier|ekspert/,
  /dostepnosc|wcag/,
  /koszt|latenc|czas.*odpowied/,
  /dokumentac/,
  /python/,
  /jakosc|walidac|poprawn/,
  /zatwierdz|korekt|popraw|reczn/,
];
const ignored = new Set([
  "projekt",
  "projek",
  "praca",
  "pracy",
  "praco",
  "zespolem",
  "zespol",
  "sposob",
  "sposo",
  "bedziesz",
  "bedzi",
  "przygotujesz",
  "przyg",
  "twoim",
  "twoje",
  "ktory",
  "ktora",
  "ktore",
  "naszy",
  "osoby",
  "razem",
  "wspol",
  "wynik",
  "danych",
  "uzytk",
  "rozwia",
]);
function terms(value: string) {
  return new Set(
    (normalize(value).match(/[a-z0-9]+/g) ?? [])
      .filter((word) => word.length >= 5 && !ignored.has(word) && !ignored.has(word.slice(0, 5)))
      .map((word) => word.slice(0, 5)),
  );
}
function relevance(expectation: string, quote: string) {
  const a = normalize(expectation);
  const b = normalize(quote);
  const sharedTopics = topics.filter((pattern) => pattern.test(a) && pattern.test(b)).length;
  const words = terms(expectation);
  const sharedWords = [...terms(quote)].filter((word) => words.has(word)).length;
  return sharedTopics * 2 + Math.min(sharedWords, 3);
}
const denial = (value: string) =>
  /\bnie\s+(?!(?:tylko|tyle)\b)|\bbez doswiadcz|brak (?:doswiadcz|wkladu|danych|pomiar)/.test(
    normalize(value),
  );
const actionStem =
  "(?:odpowiad|przeprowadz|poprowadz|zaprojektow|wybr|ustal|zbudow|wdroz|opracow|przygotow|zmierz|testow|analizow|prowadz|zrob|podj|zdecydow|wykon|implementow|zbad|rozmaw|pracow)";
const firstPersonPast = new RegExp(`\\b${actionStem}[a-z]*(?:lam|lem)\\b`);
const otherPersonPast = new RegExp(`\\b${actionStem}[a-z]*(?:l|la|li|ly)\\b`);
const ownAction = (value: string) =>
  (firstPersonPast.test(normalize(value)) ||
    /(?:^|\s)(?:odpowiadam|prowadzę|projektuję|testuję|analizuję|wdrażam|przygotowuję|buduję|wykonuję|pracuję|integruję)(?=\s|[,.;!?]|$)/i.test(
      value,
    )) &&
  !denial(value) &&
  !otherPersonPast.test(normalize(value)) &&
  !/\b(?:zespol|engineering|designer|programista|inzynier)\b/.test(
    normalize(value).replace(/\bjako (?:designer|programista|inzynier)\b/g, ""),
  );

/** Select actual offer text; never invent criteria for an unstructured/empty offer. */
export function selectedExpectations(role: RoleContext): string[] {
  const sections = role.description
    .split(/^#{1,6}\s+/m)
    .slice(1)
    .map((section) => {
      const [heading, ...body] = section.split("\n");
      return { heading: normalize(heading), body: body.join("\n").trim() };
    });
  const excluded =
    /organizacyjn|warunki|ustalenia|benefit|oferujemy|rozmowy z nami|rekrutac|wspolpraca$/;
  const relevant =
    /zakres|doswiadcz|biurku|poczatek|pierwsz|umiec|oczek|wymag|obserwac|decyz|zadani|odpowiedzial|twoja rola/;
  const candidates = sections.filter((section) => !excluded.test(section.heading));
  const preferred = candidates.filter((section) => relevant.test(section.heading));
  const selected = preferred.length ? preferred : candidates;
  const rows = selected.flatMap(({ body }) => {
    const marker = /^\s*(?:[-*]|\d+[.)])\s+/;
    const bullets = body.split("\n").filter((line) => marker.test(line));
    return bullets.length
      ? bullets.slice(0, 3).map((line) => line.replace(marker, "").trim())
      : sentences(body).slice(0, 1);
  });
  // An unstructured offer is still usable, but no organization/salary assumptions are added.
  const fallback =
    sections.length === 0
      ? sentences(role.description).filter((line) =>
          /szukamy|doswiadcz|odpowiad|bedziesz|wymag|oczek|prowadzi|projektow|testow|analiz/.test(
            normalize(line),
          ),
        )
      : [];
  return [...new Set(rows.length ? rows : fallback)].slice(0, 5);
}

export function projectEvidence(card: ProjectCard): Evidence[] {
  const sources: Evidence[] = [
    { source: "Moja praca i odpowiedzialność", quote: card.personal, personal: true },
    { source: "Praca pozostałych osób", quote: card.teamwork, personal: false },
    { source: "Kontekst projektu", quote: card.context, personal: false },
    { source: "Rezultat i jego podstawa", quote: card.outcome, personal: false },
    ...card.followUps
      .filter((item) => !item.skipped && item.answer.trim())
      .map((item) => ({
        source: "Zapisane uzupełnienie",
        quote: item.answer,
        personal: item.area === "personal" || item.area === "decisions",
      })),
  ];
  return sources;
}
function sourceFragments(sources: Evidence[]) {
  return sources.flatMap((item) =>
    sentences(item.quote).flatMap((sentence) =>
      sentence
        .split(/;\s*|,?\s+(?:a|ale|natomiast)\s+/i)
        .map((quote) => ({ ...item, quote: quote.trim() })),
    ),
  );
}
export function analyzeRoleSources(criteria: string[], sources: Evidence[]): RoleObservation[] {
  const fragments = sourceFragments(sources);
  const observations: RoleObservation[] = criteria.map((expectation) => {
    const ranked = fragments
      .filter((item) => !denial(item.quote))
      .map((item) => ({ ...item, relevance: relevance(expectation, item.quote) }))
      .filter((item) => item.relevance >= 2)
      .sort((a, b) => b.relevance - a.relevance);
    const personal = ranked.find((item) => item.personal && ownAction(item.quote));
    const evidence = personal ?? ranked[0];
    const status = personal ? "personal" : evidence ? "related" : "missing";
    return {
      expectation,
      status,
      evidence: evidence && {
        source: evidence.source,
        quote: excerpt(evidence.quote),
        personal: evidence.personal,
      },
      note: personal
        ? "W opisie własnej pracy jest powiązany przykład. Zakres spełnienia całego oczekiwania wymaga rozmowy."
        : evidence
          ? "Jest powiązany fragment, ale nie pozwala przypisać tego zadania do samodzielnej pracy kandydata."
          : "Karta nie zawiera powiązanego przykładu. Nie rozstrzyga to, czy kandydat ma takie doświadczenie.",
      question: personal
        ? `Jaka była samodzielna decyzja kandydata, jej alternatywa i skutek w obszarze: „${expectation}”?`
        : `Jaki własny przykład kandydat może omówić w odniesieniu do oczekiwania: „${expectation}”?`,
    };
  });
  return observations;
}
export function recruiterProjectReport(card: ProjectCard, role?: RoleContext, criteria?: string[]) {
  const sources = projectEvidence(card);
  const fragments = sourceFragments(sources);
  const observations = analyzeRoleSources(
    criteria ?? (role ? selectedExpectations(role) : []),
    sources,
  );
  const personalCount = observations.filter((item) => item.status === "personal").length;
  const relatedCount = observations.filter((item) => item.status === "related").length;
  const missingCount = observations.filter((item) => item.status === "missing").length;
  const firstOwn = fragments.find((item) => item.personal && ownAction(item.quote));
  const areaSource = (area: "teamwork" | "outcome", base: string) =>
    [
      base,
      ...card.followUps
        .filter((item) => item.area === area && !item.skipped)
        .map((item) => item.answer),
    ]
      .filter(Boolean)
      .join(" ");
  const qualityGaps = {
    context: {
      note: "Cel lub kontekst projektu opisano zbyt ogólnie, by ocenić porównywalność zadania.",
      question: "Dla kogo powstał projekt i jaki problem kandydat miał rozwiązać?",
    },
    personal: {
      note: "Opis nie wyodrębnia konkretnego własnego działania i zakresu odpowiedzialności.",
      question: "Które działanie kandydat wykonał osobiście i za jaki zakres odpowiadał?",
    },
    teamwork: {
      note: "Podział odpowiedzialności między kandydata i pozostałe osoby jest niejasny.",
      question: "Co wykonał zespół i gdzie kończyła się odpowiedzialność kandydata?",
    },
    decisions: {
      note: "Nie opisano wyraźnie uzasadnienia własnej decyzji ani rozważanych alternatyw.",
      question: "Jaką decyzję kandydat podjął samodzielnie, dlaczego i jaką alternatywę rozważył?",
    },
    outcome: {
      note: "Brakuje wystarczającej podstawy do oceny rezultatu: pomiaru, obserwacji lub informacji od odbiorcy.",
      question: "Na czym opiera się opisany rezultat i co można przypisać pracy kandydata?",
    },
  };
  const gaps = analyzeProject(card, card.followUps)
    .checks.filter((check) => check.status === "partial")
    .sort(
      (a, b) =>
        ["personal", "outcome", "teamwork", "decisions", "context"].indexOf(a.area) -
        ["personal", "outcome", "teamwork", "decisions", "context"].indexOf(b.area),
    )
    .map((check) => qualityGaps[check.area]);
  const roleQuestions = [...observations]
    .sort(
      (a, b) =>
        ({ missing: 0, related: 1, personal: 2 })[a.status] -
        { missing: 0, related: 1, personal: 2 }[b.status],
    )
    .slice(0, 3)
    .map((item) => item.question);
  const questions = [
    ...roleQuestions.slice(0, 1),
    ...gaps.slice(0, 2).map((gap) => gap.question),
    ...roleQuestions.slice(1),
  ].slice(0, 3);
  if (!questions.length)
    questions.push(
      "Jaki zakres pracy kandydat wykonał samodzielnie i jak sprawdzono jej rezultat?",
    );
  return {
    observations,
    personalCount,
    relatedCount,
    missingCount,
    questions,
    gaps,
    contribution: firstOwn
      ? excerpt(firstOwn.quote)
      : "Opis nie wyodrębnia konkretnego samodzielnego działania. Zakres odpowiedzialności wymaga rozmowy.",
    teamwork: excerpt(
      areaSource("teamwork", card.teamwork) || "Nie opisano pracy pozostałych osób.",
    ),
    outcome: excerpt(areaSource("outcome", card.outcome) || "Nie opisano rezultatu."),
    summary: observations.length
      ? `Dla ${personalCount} z ${observations.length} wybranych oczekiwań znaleziono powiązany przykład własnej pracy. ${relatedCount ? `Dla ${relatedCount} jest tylko powiązany kontekst lub niejasne autorstwo. ` : ""}${missingCount ? `Dla ${missingCount} brakuje informacji w karcie. ` : ""}To przegląd opisanego projektu, nie ocena całego doświadczenia kandydata.`
      : "Opis oferty nie pozwala wyodrębnić oczekiwań do porównania. Poniżej podsumowanie materiału i pytania o wkład oraz rezultaty.",
  };
}
