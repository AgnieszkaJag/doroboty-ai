import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { captureSafeEvent } from "@/lib/posthog";
import {
  finishResearchRun,
  clearResearchRun,
  readResearchRun,
  researchSummary,
  startResearchRun,
  type ResearchRun,
} from "@/lib/research-session";
import { downloadText } from "./settings";
import { PageTitle } from "./shell";

const entry = "/auth/sign-in?audience=candidate&next=/oferty";

export function TestGuidePage() {
  const [run, setRun] = useState(readResearchRun);
  const navigate = useNavigate();
  function start() {
    if (!run || run.outcome) {
      setRun(startResearchRun());
      captureSafeEvent("research_test_started");
    }
    navigate(entry);
  }
  function finish(outcome: NonNullable<ResearchRun["outcome"]>) {
    setRun(finishResearchRun(outcome));
    captureSafeEvent(outcome === "completed" ? "research_test_completed" : "research_test_blocked");
  }
  return (
    <section className="prototype-section research-guide max-w-4xl">
      <PageTitle>Test prototypu</PageTitle>
      <div className="prototype-panel prototype-form">
        <h2>Zanim zaczniesz</h2>
        <p>
          Zarezerwuj około 15 minut. Testujemy interfejs, a nie Twoje umiejętności. Pracuj
          samodzielnie i korzystaj wyłącznie z fikcyjnych danych. Nie przesyłaj własnego CV ani
          informacji o klientach. Próbna aplikacja nie trafia do prawdziwego pracodawcy.
        </p>
        <p>
          Wybierz przygotowaną osobę <strong>Anna Kowalska</strong>. Używaj jednej karty i tej samej
          przeglądarki — w niej zostanie zapisany Twój postęp.
        </p>
        <h2>Twoje zadanie</h2>
        <p>
          Wyobraź sobie, że szukasz pracy w AI. Znajdź ofertę „AI Product Manager” i przygotuj
          aplikację. Pokaż w niej fikcyjny projekt, z którego jesteś dumny lub dumna: co było
          problemem, co zrobiłaś lub zrobiłeś i jaki był rezultat. Doprowadź aplikację do wysłania,
          jeśli interfejs na to pozwoli.
        </p>
        <p>
          Przykładowy temat projektu: usprawnienie obsługi zgłoszeń w fikcyjnej firmie. Szczegóły
          możesz wymyślić. To, że część podpowiedzi AI jest przygotowana wcześniej, jest cechą tego
          prototypu.
        </p>
        <p>
          Po zadaniu wróć tutaj linkiem „Test i pomoc” w stopce lub menu. Jeśli utkniesz, po kilku
          minutach przerwij i opisz miejsce, w którym pojawił się problem. Nie musisz naprawiać go
          samodzielnie.
        </p>
        <p>
          Rozpoczęcie testu tworzy losowy kod próby, który łączy tylko etapy tej wizyty, także po
          odświeżeniu strony. Nie zawiera Twojego nazwiska. Nie nagrywamy sesji ani treści
          formularzy.
          <Link className="ml-1 underline" to="/polityka-prywatnosci">
            Informacja o danych
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <Button className="research-action" onClick={start}>
            {run && !run.outcome ? "Kontynuuj test" : "Rozpocznij test"}
          </Button>
          <Link
            className={`${buttonVariants({ variant: "outline" })} research-action`}
            to={entry}
            onClick={clearResearchRun}
          >
            Przejdź bez kodu próby
          </Link>
        </div>
      </div>
      <section
        className="prototype-panel prototype-form mt-6"
        aria-labelledby="test-feedback-title"
      >
        <h2 id="test-feedback-title">Po teście lub w razie problemu</h2>
        <p>
          Odpowiedz na wiadomość od osoby, która wysłała Ci zaproszenie. Napisz: czy udało się
          ukończyć zadanie, co było niejasne i czego zabrakło. Podaj urządzenie i przeglądarkę.
          Jeśli wystąpił błąd, dodaj przybliżoną godzinę i ostatnią wykonaną czynność. Nie dołączaj
          danych osobowych ani prawdziwych dokumentów.
        </p>
        {run && (
          <>
            <p className="break-words">
              Kod Twojej próby: <strong>{run.code}</strong>. Dołącz go do odpowiedzi.
            </p>
            {!run.outcome ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="research-action"
                  variant="outline"
                  onClick={() => finish("completed")}
                >
                  Udało mi się ukończyć zadanie
                </Button>
                <Button
                  className="research-action"
                  variant="outline"
                  onClick={() => finish("blocked")}
                >
                  Zatrzymał mnie problem
                </Button>
              </div>
            ) : (
              <p role="status">
                Zapisano zakończenie próby. Przekaż jeszcze swoją opinię w odpowiedzi na
                zaproszenie.
              </p>
            )}
            <Button
              className="research-action"
              variant="outline"
              onClick={() =>
                downloadText("doroboty-proba.txt", researchSummary(run), "text/plain;charset=utf-8")
              }
            >
              Pobierz podsumowanie próby
            </Button>
            <p>
              Plik zawiera tylko kod, daty etapów i wynik próby. Nic nie jest wysyłane za Ciebie.
            </p>
          </>
        )}
        <p>
          Nie resetuj danych podczas zgłaszania błędu. W razie potrzeby zachowaj kopię scenariusza w{" "}
          <Link className="underline" to="/app/settings">
            ustawieniach danych
          </Link>
          . Taki eksport zawiera wszystkie wpisane treści — zachowaj go dla siebie i uzgodnij
          przekazanie z osobą prowadzącą test.
        </p>
      </section>
    </section>
  );
}
