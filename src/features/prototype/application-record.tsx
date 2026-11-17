import type { ReactNode, Ref } from "react";
import { BackLink } from "@/components/back-link";
import { ProcessTimeline } from "@/components/process-timeline";
import { RecordSheet } from "@/components/record-sheet";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { ProjectCardPreview } from "./project-card";
import { RecruiterProjectAnalysis } from "./recruiter-project-analysis";
import type { RoleContext } from "./recruiter-project-report";
import { stageLabels, type Application, type Stage } from "./model";
import type { RoleRubric } from "./recruiter-assessment";

type RecordEvent = { stage: Stage; at: string; note?: string };
const dateFormat = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Role controllers authorize the record and project the history before rendering. */
export function ApplicationRecord({
  application,
  companyName,
  audience,
  history,
  statusRef,
  children,
  footer,
  roleContext,
  roleRubric,
  employerAnalysis,
  assessmentMeta,
  assessmentSummary,
  backTo,
  activeSection,
  onSectionChange,
}: {
  application: Pick<
    Application,
    | "candidateId"
    | "candidateName"
    | "jobTitle"
    | "stage"
    | "answer"
    | "cv"
    | "score"
    | "summary"
    | "projectCard"
    | "roleSnapshot"
    | "candidateSnapshot"
  >;
  companyName: string;
  audience: "candidate" | "employer";
  history: RecordEvent[];
  statusRef?: Ref<HTMLSpanElement>;
  children?: ReactNode;
  footer?: ReactNode;
  roleContext?: RoleContext;
  roleRubric?: RoleRubric;
  employerAnalysis?: ReactNode;
  assessmentMeta?: ReactNode;
  assessmentSummary?: string;
  backTo?: string;
  activeSection?: string;
  onSectionChange?: (value: string) => void;
}) {
  const candidate = audience === "candidate";
  const title = candidate ? application.jobTitle : application.candidateName;
  const context = candidate ? application.candidateName : application.jobTitle;
  const submitted = history[0];
  return (
    <article className="recruiting-record" data-audience={audience}>
      <header className="recruiting-header">
        <nav aria-label="Ścieżka nawigacji" className="record-breadcrumb">
          <BackLink to={candidate ? "/app/aplikacje" : (backTo ?? "/app/kandydaci")}>
            {candidate ? "Moje aplikacje" : "Kandydaci"}
          </BackLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        <div className="record-meta">
          <span>
            {context} · {companyName}
          </span>
          <span className="record-stage" tabIndex={-1} ref={statusRef}>
            {stageLabels[application.stage]}
          </span>
          {candidate ? <MatchScore score={application.score} /> : assessmentMeta}
          {submitted && (
            <span>
              Złożona:{" "}
              <time dateTime={submitted.at}>{dateFormat.format(new Date(submitted.at))}</time>
            </span>
          )}
        </div>
      </header>
      <div className="recruiting-layout">
        <RecordSheet
          label={candidate ? "Twoja wysłana aplikacja" : "Materiały kandydata"}
          value={activeSection}
          onValueChange={onSectionChange}
          sections={[
            ...(!candidate
              ? [
                  {
                    value: "profile",
                    label: "Profil",
                    content: (
                      <div className="recruiter-submitted-profile">
                        <p className="record-caption">
                          Profil i materiały z momentu aplikowania. Późniejsze zmiany danych
                          kandydata nie zmieniają tej kopii.
                        </p>
                        {application.candidateSnapshot && (
                          <section
                            className="recruiter-profile-section"
                            aria-labelledby="profile-about-heading"
                          >
                            <h3 id="profile-about-heading">O kandydacie</h3>
                            <p>
                              <strong>{application.candidateSnapshot.headline}</strong>
                              {application.candidateSnapshot.location &&
                                ` · ${application.candidateSnapshot.location}`}
                            </p>
                            <p>{application.candidateSnapshot.bio}</p>
                          </section>
                        )}
                        <section
                          className="recruiter-profile-section"
                          aria-labelledby="profile-cv-heading"
                        >
                          <h3 id="profile-cv-heading">CV</h3>
                          <CvAttachment
                            candidateId={application.candidateId}
                            fallbackText={application.cv}
                            layout="row"
                          />
                        </section>
                        <section
                          className="recruiter-profile-section"
                          aria-labelledby="profile-answer-heading"
                        >
                          <h3 id="profile-answer-heading">Odpowiedź w aplikacji</h3>
                          <p>{application.answer}</p>
                        </section>
                        <section
                          className="recruiter-profile-section"
                          aria-labelledby="profile-project-heading"
                        >
                          <h3 id="profile-project-heading">Karta projektu</h3>
                          {application.projectCard ? (
                            <ProjectCardPreview card={application.projectCard} />
                          ) : (
                            <p>Do tej aplikacji nie dołączono karty projektu.</p>
                          )}
                        </section>
                      </div>
                    ),
                  },
                  { value: "analysis", label: "Analiza", content: employerAnalysis },
                ]
              : []),
            {
              value: "answer",
              label: "Odpowiedź",
              content: (
                <>
                  <h3>Przesłana aplikacja</h3>
                  <p>{application.answer}</p>
                </>
              ),
            },
            ...(application.projectCard
              ? [
                  {
                    value: "project",
                    label: "Karta Projektu",
                    content: (
                      <>
                        <p className="project-help">
                          Potwierdzona kopia z momentu aplikowania. Późniejsze zmiany profilu jej
                          nie zmieniają.
                        </p>
                        {candidate ? (
                          <ProjectCardPreview card={application.projectCard} />
                        ) : (
                          <>
                            <RecruiterProjectAnalysis
                              card={application.projectCard}
                              role={roleRubric?.role ?? application.roleSnapshot ?? roleContext}
                              snapshot={Boolean(application.roleSnapshot)}
                              criteria={roleRubric?.criteria}
                              rubricVersion={roleRubric?.version}
                            />
                            <details className="recruiter-project-source">
                              <summary>Przeczytaj potwierdzoną kartę projektu</summary>
                              <ProjectCardPreview card={application.projectCard} />
                            </details>
                          </>
                        )}
                      </>
                    ),
                  },
                ]
              : []),
            {
              value: "cv",
              label: "CV",
              content: (
                <>
                  <h3>CV z momentu aplikowania</h3>
                  <CvAttachment
                    candidateId={application.candidateId}
                    fallbackText={application.cv}
                    layout="row"
                    preview
                  />
                </>
              ),
            },
          ]}
          footer={footer}
        >
          {children}
        </RecordSheet>
        <aside className="recruiting-margin" aria-label="Historia i podsumowanie">
          <section aria-labelledby="process-heading">
            <h2 id="process-heading">Historia procesu</h2>
            <ProcessTimeline
              items={history.map((event, index) => ({
                id: `${index}-${event.at}`,
                title: stageLabels[event.stage],
                dateTime: event.at,
                content: event.note || undefined,
              }))}
            />
          </section>
          <section className="record-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Podsumowanie</h2>
            <p>{candidate ? application.summary : assessmentSummary}</p>
          </section>
        </aside>
      </div>
    </article>
  );
}
