import { Component, type ReactNode } from "react";
import { captureSafeEvent } from "@/lib/posthog";
import { Button, buttonVariants } from "@/components/ui/button";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    captureSafeEvent("prototype_error", "render");
    document.getElementById("recovery-title")?.focus();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="prototype-section recovery-page max-w-4xl" tabIndex={-1}>
        <section className="prototype-panel prototype-form" aria-labelledby="recovery-title">
          <h1 id="recovery-title" tabIndex={-1}>
            Nie udało się wyświetlić tego widoku
          </h1>
          <p role="alert">
            Wystąpił problem z interfejsem. Wcześniej zapisane dane pozostają w tej przeglądarce.
            Ostatnia niezapisana zmiana mogła się nie zachować.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="research-action" onClick={() => window.location.reload()}>
              Odśwież stronę
            </Button>
            <a
              className={`${buttonVariants({ variant: "outline" })} research-action`}
              href="#/app/settings"
              onClick={(event) => {
                event.preventDefault();
                window.location.hash = "/app/settings";
                this.setState({ failed: false });
              }}
            >
              Otwórz ustawienia danych
            </a>
            <a
              className={`${buttonVariants({ variant: "outline" })} research-action`}
              href="#/testy"
              onClick={(event) => {
                event.preventDefault();
                window.location.hash = "/testy";
                this.setState({ failed: false });
              }}
            >
              Zgłoś problem prowadzącemu
            </a>
          </div>
          <p>
            Nie usuwaj danych witryny. Podaj osobie zapraszającej godzinę błędu i ostatnią czynność.
          </p>
        </section>
      </main>
    );
  }
}
