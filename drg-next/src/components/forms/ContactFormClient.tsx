"use client";

import { FormEvent, useRef, useState } from "react";
import { drgDataMode } from "@/lib/config/env";

export function ContactFormClient() {
  const mountedAt = useRef(Date.now());
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setError(true);
      setMessage("Completa correctamente todos los campos obligatorios.");
      return;
    }
    const honeypot = new FormData(form).get("website");
    if (honeypot) return;
    if (Date.now() - mountedAt.current < 1800) {
      setError(true);
      setMessage("Espera unos segundos antes de enviar el formulario.");
      return;
    }

    if (drgDataMode === "readonly" || drgDataMode === "disabled") {
      setError(false);
      setMessage("Vista de migración: el formulario está validado, pero el envío a Firestore permanece deshabilitado en staging.");
      return;
    }

    setError(true);
    setMessage("La escritura del formulario todavía no ha sido habilitada en DRG 2.0.");
  }

  return (
    <form className="drg-public-form" onSubmit={submit} noValidate>
      <div className="drg-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="drg-form-row"><label>Nombre<input name="nombre" maxLength={100} required /></label><label>Correo electrónico<input name="email" type="email" maxLength={160} required /></label></div>
      <div className="drg-form-row"><label>Teléfono<input name="telefono" type="tel" maxLength={30} required /></label></div>
      <label>Mensaje<textarea name="mensaje" rows={6} maxLength={3000} required /></label>
      <button type="submit">Enviar consulta</button>
      <p className={error ? "is-error" : ""} role="status" aria-live="polite">{message}</p>
    </form>
  );
}
