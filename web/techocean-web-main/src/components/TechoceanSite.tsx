import { useEffect } from "react";

// Mounts the original Techocean site (plain JS) once; it handles its own pages.
let started = false;

export function TechoceanSite() {
  useEffect(() => {
    if (started) return;
    started = true;
    void import("@/legacy/main.js");
  }, []);

  return (
    <>
      <div className="brasilia-clock" hidden>
        <div className="brasilia-clock-inner">
          <span className="brasilia-clock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5v4.8l3.1 1.8" />
            </svg>
          </span>
          <div className="brasilia-clock-copy">
            <span className="brasilia-clock-label">Horário de Brasília</span>
            <span className="brasilia-clock-note">Relógio do dispositivo</span>
          </div>
          <time id="brasilia-clock">Carregando data e hora…</time>
        </div>
      </div>
      <div id="app" suppressHydrationWarning />
    </>
  );
}
