import {
  useLayoutEffect,
  type ComponentProps,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { captureSafeEvent } from "@/lib/posthog";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FolderOpen,
  Plus,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { BackLink } from "@/components/back-link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form-select";
import { currentPerson, publishedJobs } from "./model";
import { usePrototype } from "./store";
import { NotFound } from "./shell";
import { newProjectInput, type ProjectAnswers, type ProjectCard } from "./project-card-model";

function ProjectTextarea({ value, ...props }: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const grow = () => {
      const element = ref.current;
      if (!element) return;
      element.style.height = "0px";
      element.style.height = `${element.scrollHeight + 2}px`;
    };
    grow();
    window.addEventListener("resize", grow);
    return () => window.removeEventListener("resize", grow);
  }, [value]);
  return <Textarea {...props} ref={ref} value={value} />;
}

export const projectPath = (id: string) => `/app/profil/projekty/${id}`;

function ProjectDeleteButton({ card, onDeleted }: { card: ProjectCard; onDeleted: () => void }) {
  const { run, error, clearError } = usePrototype();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={`Usuń projekt: ${card.title.trim() || "Projekt bez nazwy"}`}
        onClick={() => {
          clearError();
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden="true" /> Usuń projekt
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Usunąć projekt „${card.title.trim() || "Projekt bez nazwy"}”?`}
        description="Projekt zniknie z profilu i zostanie odłączony od niewysłanych szkiców aplikacji. Wysłane aplikacje zachowają swoje kopie. Usunięty projekt możesz przywrócić na profilu."
        label="Usuń projekt"
        pending={false}
        error={error}
        onConfirm={() => {
          if (run({ type: "project_delete", id: card.id })) {
            setOpen(false);
            onDeleted();
          }
        }}
      />
    </>
  );
}
const sourceLabels: Array<[keyof Omit<ProjectAnswers, "title">, string]> = [
  ["context", "Kontekst projektu"],
  ["personal", "Moja praca i odpowiedzialność"],
  ["teamwork", "Praca pozostałych osób"],
  ["outcome", "Rezultat i jego podstawa"],
];

export function ProjectCardPreview({ card }: { card: ProjectCard }) {
  return (
    <div className="project-preview">
      <h2>{card.title}</h2>
      {sourceLabels.map(([key, label]) => (
        <section className="project-reading" key={key}>
          <h3>{label}</h3>
          <p>{card[key]}</p>
        </section>
      ))}
      {card.followUps.some((item) => !item.skipped && item.answer.trim()) && (
        <section className="project-reading">
          <h3>Dodatkowe informacje zapisane wcześniej</h3>
          {card.followUps
            .filter((item) => !item.skipped && item.answer.trim())
            .map((item) => (
              <div className="project-followup-answer" key={item.area}>
                <h4>
                  {card.analysis?.checks.find((check) => check.area === item.area)?.label ??
                    "Zapisana informacja"}
                </h4>
                <p>{item.answer}</p>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}

export function ProjectAnalysisView({ card }: { card: ProjectCard }) {
  if (!card.analysis) return null;
  return (
    <section className="project-analysis" aria-label="Sprawdzenie kompletności opisu projektu">
      <div className="project-eyebrow">
        <Sparkles aria-hidden="true" /> Sprawdzenie opisu · symulacja AI
      </div>
      <h3>Co wynika z opisu?</h3>
      <p className="project-help">
        Lokalne reguły wskazują fragmenty i możliwe luki. Nie potwierdzają prawdziwości, kompetencji
        ani zgodności z rolą.
      </p>
      {card.analysis.checks.map((check) => (
        <details className="project-check" key={check.area}>
          <summary>
            <span>{check.label}</span>
            <span className="project-check-status">
              {check.status === "described" ? "Opisano" : "Warto doprecyzować"}
            </span>
          </summary>
          <p>{check.note}</p>
          {check.quote.trim() && (
            <blockquote>
              <span className="project-help">Fragment odpowiedzi kandydata</span>
              <p>{check.quote}</p>
            </blockquote>
          )}
          {check.status === "partial" && (
            <p>
              <strong>Pytanie do rozmowy:</strong> {check.question}
            </p>
          )}
        </details>
      ))}
    </section>
  );
}

export function ProjectUse({
  card,
  onReview,
  prominent = false,
}: {
  card: ProjectCard;
  onReview?: (slug: string) => void;
  prominent?: boolean;
}) {
  const { state } = usePrototype();
  const [selected, setSelected] = useState("");
  const [expanded, setExpanded] = useState(!prominent);
  const jobs = publishedJobs(state).filter(
    (job) =>
      !state.applications.some(
        (application) =>
          application.candidateId === card.candidateId && application.jobId === job.id,
      ),
  );
  const job = jobs.find((item) => item.id === selected);
  return (
    <div className={`project-use${prominent ? " project-use-prominent" : ""}`}>
      {prominent && jobs.length > 0 && (
        <>
          <div>
            <h2>Użyj karty w rekrutacji</h2>
            <p className="project-help">
              Jedną kartę możesz wykorzystać w wielu aplikacjach. Do jednej aplikacji dołączysz
              maksymalnie jedną kartę.
            </p>
          </div>
          <Button
            type="button"
            className="project-attach-action"
            aria-expanded={expanded}
            aria-controls={`project-use-options-${card.id}`}
            onClick={() => setExpanded(!expanded)}
          >
            Dołącz do rekrutacji <ArrowRight aria-hidden="true" />
          </Button>
        </>
      )}
      {!jobs.length ? (
        <p>Nie ma kolejnej dostępnej oferty w tym scenariuszu. Karta pozostaje na Twoim profilu.</p>
      ) : (
        <div
          className="project-use-options"
          id={`project-use-options-${card.id}`}
          hidden={!expanded}
        >
          <label htmlFor={`project-job-${card.id}`}>
            Do której aplikacji chcesz dołączyć kartę?
          </label>
          <FormSelect
            id={`project-job-${card.id}`}
            ariaLabel="Wybierz ofertę dla karty projektu"
            value={selected}
            onValueChange={setSelected}
            placeholder="Wybierz ofertę"
            options={jobs.map((item) => ({ value: item.id, label: item.title }))}
          />
          {card.status === "confirmed" ? (
            job && (
              <Link
                className={buttonVariants({ className: "project-attach-action" })}
                to={`/aplikuj/${job.slug}?projekt=${card.id}`}
              >
                Dołącz do rekrutacji <ArrowRight aria-hidden="true" />
              </Link>
            )
          ) : onReview ? (
            <Button
              type="button"
              className="project-attach-action"
              disabled={!job}
              onClick={() => job && onReview(job.slug)}
            >
              Sprawdź i dołącz do rekrutacji <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            job && (
              <Link
                className={buttonVariants({ className: "project-attach-action" })}
                to={`${projectPath(card.id)}?oferta=${job.slug}`}
              >
                Dokończ i dołącz do rekrutacji <ArrowRight aria-hidden="true" />
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectsSection({ preview = false }: { preview?: boolean }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const [useId, setUseId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string } | null>(null);
  const notice = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (notification) notice.current?.focus();
  }, [notification]);
  const cards = state.projectCards.filter(
    (card) => card.candidateId === person.id && (!preview || card.status === "confirmed"),
  );
  const deletedCards = state.deletedProjectCards.filter((card) => card.candidateId === person.id);
  function create() {
    captureSafeEvent("project_card_add_clicked");
    const value = newProjectInput(crypto.randomUUID());
    if (run({ type: "project_save", value, mode: "draft" })) navigate(projectPath(value.id));
  }
  return (
    <section className="project-profile-section" aria-labelledby="my-projects-title">
      <header className="project-section-header">
        <div>
          <div className="project-eyebrow">
            <FolderOpen aria-hidden="true" /> Doświadczenie w praktyce
          </div>
          <h2 id="my-projects-title">Moje projekty</h2>
          <p className="project-help">
            Opisz swoją pracę raz. Używaj karty przy kolejnych aplikacjach.
          </p>
        </div>
        {!preview && (
          <Button onClick={create}>
            <Plus aria-hidden="true" />
            Dodaj projekt
          </Button>
        )}
      </header>
      {notification && (
        <p className="project-save-status" role="status" tabIndex={-1} ref={notice}>
          {notification.text}
        </p>
      )}
      {cards.length ? (
        <div className="project-list">
          {cards.map((card) => (
            <article className="project-list-item" key={card.id}>
              <div className="project-list-heading">
                <h3>{card.title.trim() || "Projekt bez nazwy"}</h3>
                <span className="project-badge">
                  {card.status === "confirmed" ? "Potwierdzona karta" : "Szkic"}
                </span>
              </div>
              <p>
                {card.context.trim()
                  ? card.context.slice(0, 180) + (card.context.length > 180 ? "…" : "")
                  : "Opisz problem, swój wkład i rezultat projektu."}
              </p>
              <div className="project-inline-actions">
                <Link className={buttonVariants({ variant: "outline" })} to={projectPath(card.id)}>
                  {card.status === "confirmed" ? "Zobacz kartę" : "Dokończ opis"}
                </Link>
                <Button
                  className="project-attach-action"
                  aria-expanded={useId === card.id}
                  onClick={() => setUseId(useId === card.id ? null : card.id)}
                >
                  Dołącz do rekrutacji
                  <ArrowRight aria-hidden="true" />
                </Button>
                {!preview && (
                  <ProjectDeleteButton
                    card={card}
                    onDeleted={() => {
                      setUseId(null);
                      setNotification({
                        text: `Usunięto projekt „${card.title.trim() || "Projekt bez nazwy"}”. Możesz go przywrócić poniżej.`,
                      });
                    }}
                  />
                )}
              </div>
              {useId === card.id && <ProjectUse card={card} />}
            </article>
          ))}
        </div>
      ) : null}
      {!preview && deletedCards.length > 0 && (
        <details className="project-trash">
          <summary>Usunięte projekty ({deletedCards.length})</summary>
          <p className="project-help">
            Przywrócenie projektu nie dołączy go ponownie do aplikacji.
          </p>
          {deletedCards.map((card) => (
            <div className="project-trash-item" key={card.id}>
              <strong>{card.title.trim() || "Projekt bez nazwy"}</strong>
              <Button
                type="button"
                variant="outline"
                aria-label={`Przywróć projekt: ${card.title.trim() || "Projekt bez nazwy"}`}
                onClick={() => {
                  if (run({ type: "project_restore", id: card.id }))
                    setNotification({
                      text: `Przywrócono projekt „${card.title.trim() || "Projekt bez nazwy"}”.`,
                    });
                }}
              >
                <Undo2 aria-hidden="true" /> Przywróć
              </Button>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}

export function ProjectCardPage() {
  const { id } = useParams();
  const { state, run, issue, blocked } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const returnSlug = params.get("oferta");
  const returnJob = publishedJobs(state).find((job) => job.slug === returnSlug);
  const card = state.projectCards.find((item) => item.id === id && item.candidateId === person.id);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectAnswers, string>>>({});
  const [message, setMessage] = useState("");
  const [showRecruitment, setShowRecruitment] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const workflow = card?.workflow === "followups" ? "edit" : card?.workflow;
  const [legacyAreas] = useState(
    () =>
      new Set(
        card?.followUps
          .filter((item) => !item.skipped && item.answer.trim())
          .map((item) => item.area),
      ),
  );
  const view = `${workflow}:${card?.status}`;
  const lastView = useRef(view);
  useEffect(() => {
    if (lastView.current !== view) {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start" });
      lastView.current = view;
    }
  }, [view]);
  if (!card) return <NotFound />;
  const current = card;
  function save(patch: Partial<ProjectCard> = {}, mode: "draft" | "analyze" | "preview" = "draft") {
    return run({ type: "project_save", value: { ...current, ...patch }, mode });
  }
  function change(key: keyof ProjectAnswers, value: string) {
    save({ [key]: value, workflow: "edit" });
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setMessage("");
  }
  function validate() {
    const missing: Partial<Record<keyof ProjectAnswers, string>> = {};
    const labels: Array<[keyof ProjectAnswers, string]> = [
      ["title", "Podaj krótką nazwę projektu."],
      ["context", "Opisz problem i swoją rolę."],
      ["personal", "Opisz własną pracę i odpowiedzialność."],
      ["teamwork", "Opisz pracę innych osób lub zaznacz projekt samodzielny."],
      ["outcome", "Opisz rezultat lub zaznacz, że nie masz jeszcze danych."],
    ];
    for (const [key, label] of labels) if (!current[key].trim()) missing[key] = label;
    setErrors(missing);
    const first = labels.find(([key]) => missing[key]);
    if (first) document.getElementById(`project-${first[0]}`)?.focus();
    return !first;
  }
  function analyze(event: FormEvent) {
    event.preventDefault();
    if (validate() && save({}, "analyze")) setMessage("");
  }
  const status =
    issue || blocked
      ? "Zmiany są dostępne w tej sesji. Trwały zapis jest niedostępny — zachowaj je przez eksport w ustawieniach."
      : current.status === "confirmed"
        ? "Karta jest zapisana w tej przeglądarce."
        : "Szkic zapisuje się automatycznie w tej przeglądarce.";
  function field(key: keyof ProjectAnswers, label: string, help: string, placeholder: string) {
    const props = {
      id: `project-${key}`,
      value: current[key],
      maxLength: key === "title" ? 160 : 6000,
      "aria-invalid": !!errors[key],
      "aria-describedby": `project-${key}-help${errors[key] ? ` project-${key}-error` : ""}`,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        change(key, event.target.value),
    };
    return (
      <div className={`project-field project-field-${key}`}>
        <label htmlFor={props.id} className={key === "title" ? "sr-only" : undefined}>
          {label}
        </label>
        <p className="project-help" id={`project-${key}-help`}>
          {help}
        </p>
        {key === "title" ? (
          <Input {...props} placeholder={placeholder} />
        ) : (
          <ProjectTextarea {...props} placeholder={placeholder} rows={5} />
        )}
        {errors[key] && (
          <p id={`project-${key}-error`} className="project-field-error" role="alert">
            {errors[key]}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="project-page">
      <BackLink to={returnJob ? `/aplikuj/${returnJob.slug}` : "/app/profil"}>
        {returnJob ? "Wróć do aplikacji" : "Wróć do profilu"}
      </BackLink>
      <header className="project-page-header">
        <h1 ref={heading} tabIndex={-1}>
          {workflow === "edit" ? "Twój projekt. Twój wkład." : "Twoja Karta Projektu"}
        </h1>
        <p>
          {workflow === "edit"
            ? "Trzy pytania, z których powstanie karta do kolejnych aplikacji. Pokaż konkretną pracę, którą chcesz się podzielić."
            : current.status === "confirmed"
              ? "Twoja karta jest gotowa. Możesz dołączać ją do kolejnych aplikacji."
              : "Sprawdź treść przed dołączeniem karty do aplikacji. Ty decydujesz, co chcesz pokazać."}
        </p>
      </header>
      {workflow === "edit" ? (
        <form noValidate onSubmit={analyze} className="project-sheet">
          <div className="project-sheet-meta">
            <span>Karta Projektu</span>
            <span className="project-badge">Szkic</span>
          </div>
          <section className="project-question">
            <div className="project-question-title">
              <span>01</span>
              <h2>Nazwa projektu</h2>
            </div>
            {field(
              "title",
              "Nazwa projektu",
              "Krótka nazwa, po której rozpoznasz kartę.",
              "Np. Asystent obsługi zgłoszeń",
            )}
            {field(
              "context",
              "Kontekst i Twoja rola",
              "Dla kogo powstał projekt, jaki miał cel i w jakiej roli bierzesz lub brałaś / brałeś w nim udział?",
              "Opisz odbiorcę, problem i cel projektu…",
            )}
          </section>
          <section className="project-question">
            <div className="project-question-title">
              <span>02</span>
              <h2>Co konkretnie było Twoją pracą?</h2>
            </div>
            <div className="project-contributions">
              {field(
                "personal",
                "Moja praca i odpowiedzialność",
                "Wskaż własne działania, decyzje i ich powody. Za co odpowiadasz osobiście?",
                "Samodzielnie… Odpowiadam za… Wybrałam / wybrałem…, ponieważ…",
              )}
              {field(
                "teamwork",
                "Praca pozostałych osób",
                "Co zrobili inni i jak współpracowaliście? Jeśli projekt był samodzielny, napisz to wprost.",
                "Pozostałe osoby odpowiadały za… Wspólnie… / Projekt realizuję samodzielnie.",
              )}
            </div>
          </section>
          <section className="project-question">
            <div className="project-question-title">
              <span>03</span>
              <h2>Co się zmieniło i skąd to wiesz?</h2>
            </div>
            {field(
              "outcome",
              "Rezultat i jego podstawa",
              "Podaj efekt, przykład lub pomiar oraz jego źródło. Oddziel własny rezultat od wyniku zespołu. Brak danych możesz wskazać wprost.",
              "W mojej części projektu… Wiemy to z… Wynik całego zespołu…",
            )}
          </section>
          {legacyAreas.size > 0 && (
            <section className="project-question">
              <h2>Dodatkowe informacje zapisane wcześniej</h2>
              <p className="project-help">
                Zachowane z poprzedniej wersji karty. Możesz je poprawić lub wyczyścić przed
                sprawdzeniem opisu.
              </p>
              {current.followUps
                .filter((item) => legacyAreas.has(item.area))
                .map((item) => (
                  <div className="project-field" key={item.area}>
                    <label htmlFor={`legacy-${item.area}`}>
                      {current.analysis?.checks.find((check) => check.area === item.area)?.label ??
                        {
                          context: "Kontekst i cel",
                          personal: "Własny wkład",
                          teamwork: "Podział pracy",
                          decisions: "Decyzje i uzasadnienie",
                          outcome: "Rezultat i jego podstawa",
                        }[item.area]}
                    </label>
                    <ProjectTextarea
                      id={`legacy-${item.area}`}
                      rows={4}
                      maxLength={6000}
                      value={item.answer}
                      onChange={(event) =>
                        save({
                          workflow: "edit",
                          followUps: current.followUps.map((entry) =>
                            entry.area === item.area
                              ? { ...entry, answer: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
            </section>
          )}
          <div className="project-actions">
            <div className="project-inline-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (save()) {
                    setMessage("Zachowano aktualny szkic.");
                    setShowRecruitment(true);
                  }
                }}
              >
                Zapisz szkic
              </Button>
              <ProjectDeleteButton
                card={current}
                onDeleted={() => navigate(returnJob ? `/aplikuj/${returnJob.slug}` : "/app/profil")}
              />
            </div>
            <Button type="submit">
              <Sparkles aria-hidden="true" />
              Sprawdź opis z AI
            </Button>
          </div>
          <p className="project-ai-note">
            Symulacja AI: lokalne sprawdzenie kompletności opisu, bez połączenia z modelem.
          </p>
          {showRecruitment && (
            <section className="project-draft-next" aria-labelledby="project-draft-next-title">
              <h2 id="project-draft-next-title">Dołącz projekt do rekrutacji</h2>
              <p className="project-help">
                Wybierz ofertę. Sprawdzisz opis z AI i potwierdzisz kartę przed dołączeniem.
              </p>
              <ProjectUse
                card={current}
                onReview={(slug) => {
                  if (validate() && save({}, "analyze")) {
                    setMessage("");
                    setParams((previous) => {
                      previous.set("oferta", slug);
                      return previous;
                    });
                  }
                }}
              />
            </section>
          )}
        </form>
      ) : (
        <>
          {current.status === "confirmed" && (
            <div className="project-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              <span>
                {issue || blocked
                  ? "Karta potwierdzona w tej sesji. Sprawdź komunikat o zapisie."
                  : "Karta potwierdzona i zapisana na profilu."}
              </span>
            </div>
          )}
          {current.status === "confirmed" &&
            (returnJob ? (
              <div className="project-use project-use-prominent">
                <div>
                  <h2>Dołącz kartę do aplikacji</h2>
                  <p className="project-help">
                    {returnJob.title}. Tę samą kartę możesz wykorzystać także w kolejnych
                    aplikacjach.
                  </p>
                </div>
                <Link
                  className={buttonVariants({ className: "project-attach-action" })}
                  to={`/aplikuj/${returnJob.slug}?projekt=${current.id}`}
                >
                  Wróć i dołącz kartę <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <ProjectUse card={current} prominent />
            ))}
          <section className="project-sheet">
            <div className="project-sheet-meta">
              <span>
                {current.status === "confirmed" ? "Zapisana karta" : "Podgląd przed zapisem"}
              </span>
              <span className="project-badge">
                {current.status === "confirmed" ? "Potwierdzona" : "Do potwierdzenia"}
              </span>
            </div>
            <ProjectCardPreview card={current} />
            {current.status !== "confirmed" && <ProjectAnalysisView card={current} />}
            <p className="project-sharing-note">
              Rekruter zobaczy kartę, gdy dołączysz ją do aplikacji. Otrzyma potwierdzoną treść i
              wynik sprawdzenia opisu z jawnymi lukami.
            </p>
            <div className="project-actions">
              <div className="project-inline-actions">
                <Button variant="outline" onClick={() => save({ workflow: "edit" })}>
                  Popraw opis
                </Button>
                <ProjectDeleteButton
                  card={current}
                  onDeleted={() =>
                    navigate(returnJob ? `/aplikuj/${returnJob.slug}` : "/app/profil")
                  }
                />
              </div>
              {current.status !== "confirmed" && (
                <Button onClick={() => run({ type: "project_confirm", id: current.id })}>
                  <Check aria-hidden="true" />
                  Potwierdź i zapisz kartę
                </Button>
              )}
            </div>
          </section>
        </>
      )}
      <p className="project-save-status" role="status">
        {message ? `${message} ` : ""}
        {status}
      </p>
    </div>
  );
}
