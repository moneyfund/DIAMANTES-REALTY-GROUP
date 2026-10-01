"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

const messages = [
  "PROPIEDADES EN NICARAGUA",
  "VENTA · ALQUILER · INVERSIÓN",
  "ASESORÍA INMOBILIARIA",
  "MATAGALPA · ESTELÍ · MANAGUA",
  "INVIERTE CON CONFIANZA",
  "DIAMANTES REALTY GROUP",
];

export function BrandMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <aside className={"drg-brand-ribbon" + (paused ? " is-paused" : "")} aria-label="Servicios y cobertura de Diamantes Realty Group">
      <div className="drg-brand-ribbon-window">
        <div className="drg-brand-ribbon-track">
          {[0, 1].map((copy) => (
            <ul className="drg-brand-ribbon-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {messages.map((message) => <li key={message}><span className="drg-brand-ribbon-diamond" aria-hidden="true" />{message}</li>)}
            </ul>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Reanudar cinta publicitaria" : "Pausar cinta publicitaria"} aria-pressed={paused} className="drg-brand-ribbon-control">
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
    </aside>
  );
}
