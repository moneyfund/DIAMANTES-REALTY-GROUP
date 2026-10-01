"use client";

import { FormEvent, useRef, useState } from "react";
import { drgWritesEnabled } from "@/lib/config/writes";
import { cleanPublicFormValue, submitContactForm } from "@/lib/firebase/forms";

const MIN_FILL_TIME=2000;
const SESSION_COOLDOWN=15000;
const COOLDOWN_KEY="drg-form-contacto-sent";

export function ContactFormClient(){
  const mountedAt=useRef(Date.now());
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  const [busy,setBusy]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.checkValidity()){form.reportValidity();setError(true);setMessage("Completa correctamente todos los campos obligatorios.");return}
    const data=new FormData(form);
    if(cleanPublicFormValue(data.get("website"),200))return;
    if(Date.now()-mountedAt.current<MIN_FILL_TIME){setError(true);setMessage("Espera unos segundos antes de enviar el formulario.");return}
    const lastSent=Number(sessionStorage.getItem(COOLDOWN_KEY)||0);
    if(Date.now()-lastSent<SESSION_COOLDOWN){setError(true);setMessage("Tu mensaje ya fue enviado. Espera unos segundos para enviar otro.");return}

    const payload={
      nombre:cleanPublicFormValue(data.get("nombre"),100),
      telefono:cleanPublicFormValue(data.get("telefono"),30),
      correo:cleanPublicFormValue(data.get("email"),160),
      mensaje:cleanPublicFormValue(data.get("mensaje"),3000),
      paginaOrigen:(window.location.pathname+window.location.search).slice(0,300)
    };
    if(!payload.nombre||!payload.telefono||!payload.correo||!payload.mensaje){setError(true);setMessage("No se permiten envíos vacíos. Revisa los campos obligatorios.");return}
    if(!drgWritesEnabled){setError(false);setMessage("Vista de migración: el formulario está listo, pero el envío permanece bloqueado en esta Preview.");return}

    setBusy(true);setError(false);setMessage("Enviando…");
    try{
      await submitContactForm(payload);
      sessionStorage.setItem(COOLDOWN_KEY,String(Date.now()));
      form.reset();mountedAt.current=Date.now();
      setMessage("Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo.");
    }catch(cause){
      console.error("[DRG contacto]",cause);setError(true);
      setMessage(cause instanceof Error?cause.message:"No fue posible enviar el formulario. Tus datos no se borraron; intenta nuevamente.");
    }finally{setBusy(false)}
  }

  return <form className="drg-public-form" onSubmit={submit} noValidate>
    <div className="drg-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="drg-form-row"><label>Nombre<input name="nombre" maxLength={100} required/></label><label>Correo electrónico<input name="email" type="email" maxLength={160} required/></label></div>
    <div className="drg-form-row"><label>Teléfono<input name="telefono" type="tel" maxLength={30} required/></label></div>
    <label>Mensaje<textarea name="mensaje" rows={6} maxLength={3000} required/></label>
    <button type="submit" disabled={busy}>{busy?"Enviando…":"Enviar consulta"}</button>
    <p className={error?"is-error":""} role="status" aria-live="polite">{message}</p>
  </form>;
}
