import { useId, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form-select";
import { BackLink } from "@/components/back-link";
import { currentPerson, stageLabels, type State } from "./model";
import { usePrototype } from "./store";
import { Empty } from "./shell";
import {
  assessApplication,
  rubricFor,
  rubricIsCurrent,
  rubricCriteriaSchema,
  recruiterDetailPath,
} from "./recruiter-assessment";
import { recruiterProjectReport, selectedExpectations } from "./recruiter-project-report";

type Job = State["jobs"][number];
const plural = new Intl.PluralRules("pl");
const excerpt = (text: string) =>
  text.length > 145 ? `${text.slice(0, 145).replace(/\s+\S*$/, "")}…` : text;

export function RoleRubricPanel({ job }: { job: Job }) {
  const { state, run } = usePrototype();
  const rubric = rubricFor(state, job.id);
  const [criteria, setCriteria] = useState(rubric?.criteria ?? selectedExpectations(job));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const disclosure = useRef<HTMLDetailsElement>(null);
  const firstField = useRef<HTMLTextAreaElement>(null);
  const prefix = useId();
  function confirm(event: FormEvent) {
    event.preventDefault();
    const parsed = rubricCriteriaSchema.safeParse(criteria);
    if (!parsed.success) {
      setError("Dodaj od 1 do 5 różnych kryteriów, każde od 10 do 1000 znaków.");
      firstField.current?.focus();
      return;
    }
    if (run({ type: "rubric_confirm", jobId: job.id, criteria: parsed.data })) {
      setError("");
      setCriteria(parsed.data);
      setNotice(`Zatwierdzono kryteria roli. Wersja ${(rubric?.version ?? 0) + 1}.`);
      if (disclosure.current) disclosure.current.open = false;
      disclosure.current?.querySelector("summary")?.focus();
    }
  }
  return (
    <>
      <details className="recruiter-rubric" ref={disclosure}>
        <summary>
          {rubric ? `Kryteria roli · wersja ${rubric.version}` : "Ustal kryteria ocen"}
        </summary>
        <p className="record-caption">
          Wspólne dla wszystkich aplikacji do tej roli. Propozycję z opisu oferty możesz poprawić.
          Zapis wymaga potwierdzenia.
        </p>
        <form onSubmit={confirm} className="recruiter-rubric-form">
          {(criteria.length ? criteria : [""]).map((value, index) => (
            <div className="recruiter-criterion-field" key={index}>
              <label htmlFor={`${prefix}-${index}`}>Kryterium {index + 1}</label>
              <Textarea
                id={`${prefix}-${index}`}
                ref={index === 0 ? firstField : undefined}
                rows={2}
                minLength={10}
                maxLength={1000}
                required
                value={value}
                onChange={(event) => {
                  const next = criteria.length ? [...criteria] : [""];
                  next[index] = event.target.value;
                  setCriteria(next);
                }}
              />
              {criteria.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCriteria(criteria.filter((_, i) => i !== index));
                    requestAnimationFrame(() => firstField.current?.focus());
                  }}
                >
                  Usuń kryterium {index + 1}
                </Button>
              )}
            </div>
          ))}
          {error && (
            <p role="alert" className="project-field-error">
              {error}
            </p>
          )}
          <div className="recruiter-rubric-actions">
            <Button
              variant="outline"
              type="button"
              size="sm"
              disabled={criteria.length >= 5}
              onClick={() => setCriteria([...(criteria.length ? criteria : [""]), ""])}
            >
              Dodaj kryterium
            </Button>
            <Button variant="outline" type="submit" size="sm">
              Potwierdź kryteria i przelicz
            </Button>
          </div>
          <p className="record-caption">
            0 pkt: brak informacji; 1 pkt: powiązany opis; 2 pkt: powiązany przykład własnej pracy.
            Zmiana kryteriów tworzy nową wersję i aktualizuje ocenę wszystkich aplikacji do roli.
          </p>
        </form>
      </details>
      {rubric && !rubricIsCurrent(rubric, job) && (
        <p className="recruiter-list-caption">
          Opis oferty zmienił się po zatwierdzeniu kryteriów. Oceny nadal używają wersji{" "}
          {rubric.version}. Sprawdź kryteria i potwierdź je ponownie.
        </p>
      )}
      <p role="status" className="record-caption">
        {notice}
      </p>
    </>
  );
}

export function RecruiterCandidates() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const [params, setParams] = useSearchParams();
  const jobs = state.jobs.filter((job) => job.companyId === person.companyId);
  const roleId = params.get("oferta") ?? "";
  const job = jobs.find((item) => item.id === roleId);
  const query = params.get("q") ?? "";
  const applications = state.applications.filter(
    (application) =>
      application.companyId === person.companyId &&
      (!roleId || application.jobId === job?.id) &&
      `${application.candidateName} ${application.jobTitle}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === "q" });
  }
  if (roleId && !job)
    return (
      <Empty>
        <h1>Ta oferta nie jest dostępna</h1>
        <p>Wybierz ofertę ze swojej firmy.</p>
        <Link to="/app/kandydaci">Wróć do kandydatów</Link>
      </Empty>
    );
  const count = applications.length;
  return (
    <section className="recruiter-candidates">
      <BackLink to="/app/oferty">Moje oferty</BackLink>
      <header className="recruiter-list-heading">
        <div>
          <p className="project-eyebrow">{job ? "Kandydaci do roli" : "Strefa rekrutera"}</p>
          <h1>{job?.title ?? "Kandydaci"}</h1>
          <p className="recruiter-list-caption" role="status">
            {count}{" "}
            {plural.select(count) === "one"
              ? "aplikacja"
              : plural.select(count) === "few"
                ? "aplikacje"
                : "aplikacji"}{" "}
            · {applications.filter((item) => item.projectCard).length} z kartą projektu
          </p>
        </div>
        <div className="recruiter-list-controls">
          <label>
            Oferta
            <FormSelect
              value={roleId}
              ariaLabel="Oferta"
              onValueChange={(value) => filter("oferta", value)}
              options={[
                { value: "", label: "Wszystkie oferty" },
                ...jobs.map((item) => ({ value: item.id, label: item.title })),
              ]}
            />
          </label>
          <label>
            Szukaj kandydata lub oferty
            <Input value={query} onChange={(event) => filter("q", event.target.value)} />
          </label>
        </div>
      </header>
      {job ? (
        <RoleRubricPanel job={job} key={job.id} />
      ) : (
        <p className="recruiter-list-caption">
          Wybierz ofertę, aby sprawdzić lub ustalić wspólne kryteria ocen.
        </p>
      )}
      {job && !rubricFor(state, job.id) && (
        <p className="recruiter-list-caption">
          Zatwierdź kryteria roli, aby zobaczyć oceny całości i projektu.
        </p>
      )}
      {applications.length ? (
        <>
          <div className="recruiter-table-head" aria-hidden="true">
            <span>Kandydat</span>
            <span>Całość</span>
            <span>Projekt</span>
            <span>Etap</span>
            <span>Akcje</span>
          </div>
          <div className="recruiter-list">
            {applications.map((application) => {
              const assessment = assessApplication(
                application,
                rubricFor(state, application.jobId),
              );
              const summary = excerpt(
                application.projectCard
                  ? recruiterProjectReport(application.projectCard).contribution
                  : application.answer,
              );
              const stage = stageLabels[application.stage];
              return (
                <article
                  className="recruiter-candidate-row"
                  key={application.id}
                  aria-label={`${application.candidateName} · ${application.jobTitle}`}
                >
                  <div className="recruiter-candidate-identity">
                    <div className="recruiter-candidate-name">
                      <Link to={recruiterDetailPath(application.id, params)}>
                        {application.candidateName}
                      </Link>
                      <span className="recruiter-stage recruiter-stage-mobile">{stage}</span>
                    </div>
                    {!job && (
                      <Link
                        className="recruiter-candidate-role"
                        to={`/app/kandydaci?oferta=${encodeURIComponent(application.jobId)}`}
                      >
                        {application.jobTitle}
                      </Link>
                    )}
                    <p>{summary}</p>
                  </div>
                  <div
                    className="recruiter-coverage"
                    aria-label={`Całość materiałów: ${assessment ? `${assessment.overall.percent}%` : "brak zatwierdzonych kryteriów"}`}
                  >
                    <span className="recruiter-mobile-label">Całość</span>
                    {assessment ? (
                      <strong>{assessment.overall.percent}%</strong>
                    ) : (
                      <span className="recruiter-no-score">Brak kryteriów</span>
                    )}
                  </div>
                  <div className="recruiter-coverage" aria-label="Ocena karty projektu">
                    <span className="recruiter-mobile-label">Projekt</span>
                    {!application.projectCard ? (
                      <span className="recruiter-no-score">Brak karty</span>
                    ) : assessment?.project ? (
                      <strong>{assessment.project.percent}%</strong>
                    ) : (
                      <span className="recruiter-no-score">Brak kryteriów</span>
                    )}
                  </div>
                  <span className="recruiter-stage recruiter-stage-desktop">{stage}</span>
                  <div className="recruiter-row-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="recruiter-profile-link"
                      render={<Link to={recruiterDetailPath(application.id, params)} />}
                      aria-label={`Profil kandydata: ${application.candidateName}`}
                    >
                      Profil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="recruiter-analysis-link"
                      render={<Link to={recruiterDetailPath(application.id, params, true)} />}
                      aria-label={`Analiza kandydata: ${application.candidateName}`}
                    >
                      Analiza
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="recruiter-list-caption">
            Oceny oznaczają pokrycie oczekiwań w przesłanych materiałach. Całość: CV, odpowiedź i
            karta; projekt: sama karta. Lokalna symulacja nie potwierdza kompetencji. Brak karty nie
            jest oceną 0%.
          </p>
        </>
      ) : (
        <Empty>
          Brak aplikacji spełniających kryteria.
          {query && (
            <Button variant="ghost" onClick={() => filter("q", "")}>
              Wyczyść wyszukiwanie
            </Button>
          )}
        </Empty>
      )}
    </section>
  );
}
