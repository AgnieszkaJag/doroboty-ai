import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationRecord } from "./application-record";
import { nextStages, stageLabels, type Application } from "./model";
import { usePrototype } from "./store";
import { useSearchParams } from "react-router";
import { assessApplication, rubricFor, recruiterListPath } from "./recruiter-assessment";
import { RecruiterAssessmentView } from "./recruiter-assessment-view";

export function RecruitingApplication({ application }: { application: Application }) {
  const { state, run } = usePrototype();
  const [note, setNote] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const statusRef = useRef<HTMLSpanElement>(null);
  const pendingFocus = useRef(false);
  const company = state.companies.find((item) => item.id === application.companyId);
  const availableStages = nextStages[application.stage];
  const [params, setParams] = useSearchParams();
  const rubric = rubricFor(state, application.jobId);
  const assessment = assessApplication(application, rubric);
  const allowed = [
    "profile",
    "analysis",
    "answer",
    "cv",
    ...(application.projectCard ? ["project"] : []),
  ];
  const section = allowed.includes(params.get("sekcja") ?? "") ? params.get("sekcja")! : "profile";

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      statusRef.current?.focus();
      pendingFocus.current = false;
    }
  }, [application.stage]);

  return (
    <>
      <ApplicationRecord
        application={application}
        companyName={company?.name ?? ""}
        audience="employer"
        roleContext={state.jobs.find((item) => item.id === application.jobId)}
        roleRubric={rubric}
        employerAnalysis={<RecruiterAssessmentView application={application} rubric={rubric} />}
        assessmentMeta={
          assessment ? (
            <>
              <span>Całość: {assessment.overall.percent}%</span>
              <span>
                Projekt: {assessment.project ? `${assessment.project.percent}%` : "brak karty"}
              </span>
            </>
          ) : (
            <span>Oceny: brak zatwierdzonych kryteriów</span>
          )
        }
        assessmentSummary={
          assessment?.summary ?? "Zatwierdź kryteria roli, aby porównać dostarczone materiały."
        }
        backTo={recruiterListPath(params)}
        activeSection={section}
        onSectionChange={(value) => {
          const next = new URLSearchParams(params);
          if (value === "profile") next.delete("sekcja");
          else next.set("sekcja", value);
          setParams(next, { replace: true });
        }}
        history={application.events}
        statusRef={statusRef}
        footer={
          availableStages.length > 0 ? (
            <>
              <p className="record-caption">Notatka zapisze się w historii po zmianie etapu.</p>
              <div className="record-actions">
                {availableStages.map((stage) => (
                  <Button
                    key={stage}
                    variant={stage === "rejected" ? "outline" : "default"}
                    onClick={() => {
                      if (run({ type: "stage", applicationId: application.id, stage, note })) {
                        setNote("");
                        setAnnouncement(`Zapisano etap: ${stageLabels[stage]}.`);
                        pendingFocus.current = true;
                      }
                    }}
                  >
                    {stageLabels[stage]}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="record-caption">
              {stageLabels[application.stage]}. Brak kolejnych działań w tym procesie.
            </p>
          )
        }
      >
        {availableStages.length > 0 ? (
          <>
            <h3>
              <label htmlFor="recruiting-note">Notatka rekrutacyjna</label>
            </h3>
            <p className="record-caption" id="recruiting-note-hint">
              Widoczna tylko pracodawcy w tym scenariuszu.
            </p>
            <Textarea
              id="recruiting-note"
              aria-label="Notatka rekrutacyjna (widoczna pracodawcy)"
              aria-describedby="recruiting-note-hint"
              maxLength={12000}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Co warto sprawdzić w rozmowie?"
            />
          </>
        ) : null}
      </ApplicationRecord>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
