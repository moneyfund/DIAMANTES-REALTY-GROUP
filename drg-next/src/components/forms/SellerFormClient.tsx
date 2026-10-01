"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { readAgents } from "@/lib/firebase/agents";
import { normalizeExternalUrl } from "@/lib/agents/utils";
import { drgDataMode } from "@/lib/config/env";
import type { Agent } from "@/types/agent";

export function SellerFormClient() {
  const mountedAt = useRef(Date.now());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => { readAgents().then(setAgents).catch(console.error); }, []);
  const selected = useMemo(() => agents.find((agent) => agent.id === agentId) || null, [agents, agentId]);
  const whatsapp = selected ? normalizeExternalUrl(selected.whatsapp || selected.phone, "whatsapp") : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity(); setError(true); setMessage("Completa correctamente todos los campos obligatorios."); return;
    }
    if (new FormData(form).get("website")) return;
    if (Date.now() - mountedAt.current < 1800) {
      setError(true); setMessage("Espera unos segundos antes de enviar el formulario."); return;
    }
    if (drgDataMode === "readonly" || drgDataMode === "disabled") {
      setError(false); setMessage("Vista de migración: los datos están validados, pero el envío a Firestore permanece deshabilitado en staging."); return;
    }
    setError(true); setMessage("La escritura del formulario todavía no ha sido habilitada en DRG 2.0.");
  }

  return (
    <div className="drg-seller-grid">
      <form className="drg-public-form drg-seller-form" onSubmit={submit} noValidate>
        <div className="drg-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <h1>Vende tu propiedad</h1>
        <div className="drg-form-row"><label>Nombre<input name="name" autoComplete="name" maxLength={100} required /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" maxLength={30} required /></label></div>
        <div className="drg-form-row"><label>Email<input name="email" type="email" autoComplete="email" maxLength={160} required /></label><label>Tipo de publicación<select name="listing-type" defaultValue="" required><option value="">Selecciona</option><option>Venta</option><option>Alquiler</option></select></label></div>
        <div className="drg-form-row"><label>Tipo de propiedad<select name="property-type" defaultValue="" required><option value="">Selecciona</option><option>Casa</option><option>Apartamento</option><option>Terreno</option><option>Finca</option><option>Local comercial</option></select></label><label>Ciudad<input name="city" maxLength={120} required /></label></div>
        <label>Información de la propiedad<textarea name="message" rows={4} maxLength={3000} placeholder="Ubicación, estado, precio estimado y cualquier información importante." required /></label>
        <button type="submit">Enviar información</button>
        <p className={error ? "is-error" : ""} role="status" aria-live="polite">{message}</p>
      </form>

      <aside className="drg-seller-agent">
        <p className="drg-kicker">Contacto directo</p><h2>Contacta un asesor</h2>
        <p>Si prefieres conversar directamente, selecciona un agente disponible y abre WhatsApp.</p>
        <label>Asesor<select value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="">{agents.length ? "Selecciona un asesor" : "Cargando asesores..."}</option>{agents.filter((agent) => agent.whatsapp || agent.phone).map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        {whatsapp ? <a className="drg-seller-whatsapp" href={whatsapp + (whatsapp.includes("?") ? "&" : "?") + "text=" + encodeURIComponent("Hola, quiero vender mi propiedad y deseo más información.")} target="_blank" rel="noreferrer">Contactar por WhatsApp</a> : <span className="drg-seller-whatsapp is-disabled">Selecciona un asesor</span>}
      </aside>
    </div>
  );
}
