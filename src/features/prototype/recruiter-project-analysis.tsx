import { useId } from "react";
import { Sparkles } from "lucide-react";
import type { ProjectCard } from "./project-card-model";
import { recruiterProjectReport, type RoleContext } from "./recruiter-project-report";

const labels = {
  personal: "Powiązany przykład własnej pracy",
  related: "Powiązany opis · wkład nieustalony",
  missing: "Brak informacji w karcie",
};

export function RecruiterProjectAnalysis({
  card,
  role,
  snapshot,
  criteria,
  rubricVersion,
  showExpectations = true,
}: {
  card: ProjectCard;
  role?: RoleContext;
  snapshot: boolean;
  criteria?: string[];
  rubricVersion?: number;
  showExpectations?: boolean;
}) {
  const headingId = useId();
  const report = recruiterProjectReport(card, role, criteria);
  return (
    <section className="recruiter-project-report" aria-labelledby={headingId}>
      <div className="project-eyebrow">
        <Sparkles aria-hidden="true" />
        Analiza dla rekrutera · symulacja AI
      </div>
      <h2 id={headingId}>Co ten projekt wnosi do roli?</h2>
      <p className="recruiter-report-context">
        {role?.title ?? "Rola niedostępna"} · Projekt: {card.title}
      </p>
      <p className="record-caption">
        {rubricVersion
          ? `Porównanie ze wspólnymi kryteriami roli w wersji ${rubricVersion}.`
          : snapshot
            ? "Porównanie z opisem oferty zapisanym w momencie aplikowania."
            : role
              ? "Starsza aplikacja: porównanie z aktualnym opisem oferty. Edycja oferty zmieni to porównanie."
              : "Brak dostępnego opisu oferty do porównania."}
      </p>
      <dl className="recruiter-project-summary">
        <div>
          <dt>Własna praca</dt>
          <dd>{report.contribution}</dd>
        </div>
        <div>
          <dt>Praca pozostałych osób</dt>
          <dd>{report.teamwork}</dd>
        </div>
        <div>
          <dt>Rezultat opisany w projekcie</dt>
          <dd>{report.outcome}</dd>
        </div>
      </dl>
      <p>{report.summary}</p>
      <p className="record-caption">
        Lokalna symulacja łączy fragmenty po słowach i tematach. Nie potwierdza prawdziwości,
        kompetencji ani spełnienia całego wymagania. Brak informacji nie oznacza braku umiejętności.
      </p>
      {report.gaps.length > 0 && (
        <section className="recruiter-interview" aria-label="Ograniczenia opisu projektu">
          <h3>Co pozostaje do sprawdzenia?</h3>
          <ul>
            {report.gaps.map((gap) => (
              <li key={gap.note}>{gap.note}</li>
            ))}
          </ul>
        </section>
      )}
      {showExpectations && report.observations.length > 0 && (
        <section className="recruiter-expectations" aria-label="Wybrane oczekiwania z opisu oferty">
          <h3>Wybrane oczekiwania z opisu oferty</h3>
          <p className="record-caption">
            {rubricVersion
              ? "Oczekiwania zatwierdzone przez rekrutera dla tej roli. Te same kryteria służą do ocen na liście kandydatów."
              : "Oczekiwania pochodzą z treści ogłoszenia. Nie są zatwierdzoną rubryką scoringową."}
          </p>
          {report.observations.map((item) => (
            <details className="recruiter-expectation" key={item.expectation}>
              <summary>
                <span>{item.expectation}</span>
                <span className="project-badge" data-evidence={item.status}>
                  {labels[item.status]}
                </span>
              </summary>
              <p>{item.note}</p>
              {item.evidence && (
                <figure>
                  <blockquote>{item.evidence.quote}</blockquote>
                  <figcaption>Źródło: {item.evidence.source}</figcaption>
                </figure>
              )}
            </details>
          ))}
        </section>
      )}
      <section className="recruiter-interview" aria-label="Pytania do rozmowy">
        <h3>Co sprawdzić na rozmowie?</h3>
        <ol>
          {report.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
    </section>
  );
}
