import { Link } from "react-router";
import type { Application } from "./model";
import { assessApplication, type RoleRubric } from "./recruiter-assessment";
import { RecruiterProjectAnalysis } from "./recruiter-project-analysis";

const statusLabels = {
  personal: "Powiązany przykład · 2 pkt",
  related: "Częściowy opis · 1 pkt",
  missing: "Brak informacji · 0 pkt",
};
export function RecruiterAssessmentView({
  application,
  rubric,
}: {
  application: Application;
  rubric?: RoleRubric;
}) {
  const assessment = assessApplication(application, rubric);
  if (!assessment)
    return (
      <section>
        <h3>Analiza materiałów</h3>
        <p>
          Najpierw zatwierdź wspólne kryteria tej roli. Wtedy oceny całości i projektu będą
          porównywalne dla wszystkich aplikacji.
        </p>
        <Link to={`/app/kandydaci?oferta=${encodeURIComponent(application.jobId)}`}>
          Ustal kryteria roli
        </Link>
      </section>
    );
  return (
    <section className="recruiter-assessment">
      <p className="project-eyebrow">Analiza dla rekrutera · lokalna symulacja AI</p>
      <h2>Co wynika z przesłanych materiałów?</h2>
      <p>{assessment.summary}</p>
      <p className="record-caption">
        {rubric!.role.title} · kryteria w wersji {rubric!.version}, potwierdzone{" "}
        {new Intl.DateTimeFormat("pl", { dateStyle: "medium" }).format(
          new Date(rubric!.confirmedAt),
        )}
        . Analiza korzysta z tej samej wersji co lista kandydatów.
      </p>
      <dl className="recruiter-assessment-scores">
        <div>
          <dt>Całość materiałów do roli</dt>
          <dd>
            {assessment.overall.percent}%{" "}
            <span>
              ({assessment.overall.points}/{assessment.overall.maximum} pkt)
            </span>
          </dd>
        </div>
        <div>
          <dt>Karta projektu do roli</dt>
          <dd>
            {assessment.project ? (
              <>
                {assessment.project.percent}%{" "}
                <span>
                  ({assessment.project.points}/{assessment.project.maximum} pkt)
                </span>
              </>
            ) : (
              "Brak karty"
            )}
          </dd>
        </div>
      </dl>
      <p className="record-caption">
        Wynik pokazuje powiązania tekstu z oczekiwaniami, nie potwierdza ich pełnego spełnienia ani
        kompetencji. 0 pkt oznacza brak informacji, 1 pkt — powiązany opis, 2 pkt — powiązany
        przykład własnej pracy. Całość wybiera najlepszy przykład z CV, odpowiedzi lub karty, bez
        wielokrotnego naliczania tego samego kryterium.
      </p>
      <h3>Oczekiwania i fragmenty źródłowe</h3>
      {assessment.overall.observations.map((observation, index) => {
        const project = assessment.project?.observations[index];
        return (
          <details className="recruiter-expectation" key={observation.expectation}>
            <summary>
              <span>{observation.expectation}</span>
              <span className="recruiter-assessment-labels">
                Całość: {statusLabels[observation.status]}
                <br />
                Projekt: {project ? statusLabels[project.status] : "nie dołączono karty"}
              </span>
            </summary>
            {observation.evidence ? (
              <figure>
                <blockquote>{observation.evidence.quote}</blockquote>
                <figcaption>Całość · źródło: {observation.evidence.source}</figcaption>
              </figure>
            ) : (
              <p>
                Brak powiązanego fragmentu w materiałach. Nie przesądza to o doświadczeniu
                kandydata.
              </p>
            )}
            {project?.evidence && (
              <figure>
                <blockquote>{project.evidence.quote}</blockquote>
                <figcaption>Projekt · źródło: {project.evidence.source}</figcaption>
              </figure>
            )}
          </details>
        );
      })}
      {application.projectCard && (
        <RecruiterProjectAnalysis
          card={application.projectCard}
          role={rubric!.role}
          snapshot
          rubricVersion={rubric!.version}
          criteria={rubric!.criteria}
          showExpectations={false}
        />
      )}
    </section>
  );
}
