"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { readAgents } from "@/lib/firebase/agents";
import { normalizeExternalUrl } from "@/lib/agents/utils";
import { drgWritesEnabled } from "@/lib/config/writes";
import { cleanPublicFormValue, submitSellerForm } from "@/lib/firebase/forms";
import type { Agent } from "@/types/agent";

const MIN_FILL_TIME=2000;
const SESSION_COOLDOWN=15000;
const COOLDOWN_KEY="drg-form-quiero-vender-sent";

export function SellerFormClient(){
  const mountedAt=useRef(Date.now());
  const [agents,setAgents]=useState<Agent[]>([]);
  const [agentId,setAgentId]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{readAgents().then(setAgents).catch(console.error)},[]);
  const selected=useMemo(()=>agents.find(agent=>agent.id===agentId)||null,[agents,agentId]);
  const whatsapp=selected?normalizeExternalUrl(selected.whatsapp||selected.phone,"whatsapp"):"";

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
      nombre:cleanPublicFormValue(data.get("name"),100),
      telefono:cleanPublicFormValue(data.get("phone"),30),
      correo:cleanPublicFormValue(data.get("email"),160),
      mensaje:cleanPublicFormValue(data.get("message"),3000),
      tipoPropiedad:cleanPublicFormValue(data.get("property-type"),80),
      modalidad:cleanPublicFormValue(data.get("listing-type"),30),
      ciudad:cleanPublicFormValue(data.get("city"),120),
      paginaOrigen:(window.location.pathname+window.location.search).slice(0,300)
    };
    if(!payload.nombre||!payload.telefono||!payload.correo||!payload.mensaje||!payload.tipoPropiedad||!payload.modalidad||!payload.ciudad){setError(true);setMessage("No se permiten envíos vacíos. Revisa los campos obligatorios.");return}
    if(!drgWritesEnabled){setError(false);setMessage("Vista de migración: el formulario está listo, pero el envío permanece bloqueado en esta Preview.");return}

    setBusy(true);setError(false);setMessage("Enviando…");
    try{
      await submitSellerForm(payload);
      sessionStorage.setItem(COOLDOWN_KEY,String(Date.now()));
      form.reset();mountedAt.current=Date.now();
      setMessage("Tu información fue enviada correctamente. Nuestro equipo evaluará tu propiedad y se pondrá en contacto contigo.");
    }catch(cause){
      console.error("[DRG quiero vender]",cause);setError(true);
      setMessage(cause instanceof Error?cause.message:"No fue posible enviar el formulario. Tus datos no se borraron; intenta nuevamente.");
    }finally{setBusy(false)}
  }

  return <div className="drg-seller-grid">
    <form className="drg-public-form drg-seller-form" onSubmit={submit} noValidate>
      <div className="drg-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <h1>Vende tu propiedad</h1>
      <div className="drg-form-row"><label>Nombre<input name="name" autoComplete="name" maxLength={100} required/></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" maxLength={30} required/></label></div>
      <div className="drg-form-row"><label>Email<input name="email" type="email" autoComplete="email" maxLength={160} required/></label><label>Tipo de publicación<select name="listing-type" defaultValue="" required><option value="">Selecciona</option><option value="Venta">Venta</option><option value="Alquiler">Alquiler</option></select></label></div>
      <div className="drg-form-row"><label>Tipo de propiedad<select name="property-type" defaultValue="" required><option value="">Selecciona</option><option>Casa</option><option>Apartamento</option><option>Terreno</option><option>Finca</option><option>Local comercial</option></select></label><label>Ciudad<input name="city" maxLength={120} required/></label></div>
      <label>Información de la propiedad<textarea name="message" rows={4} maxLength={3000} placeholder="Ubicación, estado, precio estimado y cualquier información importante." required/></label>
      <button type="submit" disabled={busy}>{busy?"Enviando…":"Enviar información"}</button>
      <p className={error?"is-error":""} role="status" aria-live="polite">{message}</p>
    </form>

    <aside className="drg-seller-agent">
      <p className="drg-kicker">Contacto directo</p><h2>Contacta un asesor</h2>
      <p>Si prefieres conversar directamente, selecciona un agente disponible y abre WhatsApp.</p>
      <label>Asesor<select value={agentId} onChange={event=>setAgentId(event.target.value)}><option value="">{agents.length?"Selecciona un asesor":"Cargando asesores..."}</option>{agents.filter(agent=>agent.whatsapp||agent.phone).map(agent=><option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      {whatsapp?<a className="drg-seller-whatsapp" href={whatsapp+(whatsapp.includes("?")?"&":"?")+"text="+encodeURIComponent("Hola, quiero vender mi propiedad y deseo más información.")} target="_blank" rel="noreferrer">Contactar por WhatsApp</a>:<span className="drg-seller-whatsapp is-disabled">Selecciona un asesor</span>}
    </aside>
  </div>;
}
