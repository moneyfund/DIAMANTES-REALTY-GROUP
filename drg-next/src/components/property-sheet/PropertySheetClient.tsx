"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Mail, MapPin, Phone } from "lucide-react";
import { readPrivatePropertyById } from "@/lib/firebase/private-properties";
import { readAgentById } from "@/lib/firebase/agents";
import { getPropertyFeatures, getPublishingAgentId, getPublishingAgentName, getPublishingAgentPhone } from "@/lib/properties/detail";
import type { Property } from "@/types/property";
import type { Agent } from "@/types/agent";

function proxy(url:string){return url?"/api/property-sheet-image?url="+encodeURIComponent(url):""}
function operation(value:string){return value==="alquiler"?"Alquiler":value==="venta_renta"?"Venta / Renta":"Venta"}
function slug(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"propiedad"}

export function PropertySheetClient({propertyId}:{propertyId:string}){
  const [property,setProperty]=useState<Property|null>(null);
  const [agent,setAgent]=useState<Agent|null>(null);
  const [status,setStatus]=useState<"loading"|"ready"|"missing"|"error">("loading");
  const [generating,setGenerating]=useState(false);
  const sheetRef=useRef<HTMLElement>(null);

  useEffect(()=>{
    let cancelled=false;
    void readPrivatePropertyById(propertyId).then(async item=>{
      if(cancelled)return;
      if(!item){setStatus("missing");return}
      setProperty(item);
      const agentId=getPublishingAgentId(item);
      if(agentId){
        const found=await readAgentById(agentId);
        if(!cancelled)setAgent(found);
      }
      if(!cancelled)setStatus("ready");
    }).catch(error=>{console.error(error);if(!cancelled)setStatus("error")});
    return()=>{cancelled=true};
  },[propertyId]);

  const features=useMemo(()=>property?getPropertyFeatures(property).slice(0,10):[],[property]);

  async function downloadPdf(){
    if(!sheetRef.current||!property)return;
    setGenerating(true);
    try{
      const [{default:html2canvas},{jsPDF}]=await Promise.all([import("html2canvas"),import("jspdf")]);
      if(document.fonts?.ready)await document.fonts.ready;
      const canvas=await html2canvas(sheetRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false});
      const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
      const width=210;
      const height=canvas.height*width/canvas.width;
      const image=canvas.toDataURL("image/jpeg",0.94);
      if(height<=297){
        pdf.addImage(image,"JPEG",0,0,width,height,undefined,"FAST");
      }else{
        const pageHeight=297;
        let remaining=height;
        let position=0;
        pdf.addImage(image,"JPEG",0,position,width,height,undefined,"FAST");
        remaining-=pageHeight;
        while(remaining>0){
          position=remaining-height;
          pdf.addPage();
          pdf.addImage(image,"JPEG",0,position,width,height,undefined,"FAST");
          remaining-=pageHeight;
        }
      }
      pdf.save("ficha-tecnica-"+slug(property.title)+".pdf");
    }catch(error){console.error("[DRG PDF]",error);alert("No fue posible generar el PDF. Inténtalo nuevamente.");}
    finally{setGenerating(false)}
  }

  if(status==="loading")return <div className="drg-sheet-state">Cargando ficha técnica…</div>;
  if(status==="missing")return <div className="drg-sheet-state"><h1>Propiedad no encontrada</h1><Link href="/agent-dashboard">Volver al panel</Link></div>;
  if(status==="error"||!property)return <div className="drg-sheet-state"><h1>No pudimos preparar la ficha.</h1><Link href="/agent-dashboard">Volver al panel</Link></div>;

  const images=property.images.length?property.images:(property.coverImage?[property.coverImage]:[]);
  const cover=images[0]||"";
  const gallery=images.slice(1,5);
  const name=agent?.name||getPublishingAgentName(property)||"Diamantes Realty Group";
  const phone=agent?.phone||getPublishingAgentPhone(property);
  const email=agent?.email||String(property.raw.agentEmail||"");
  const whatsapp=agent?.whatsapp||phone;

  return <div className="drg-sheet-page">
    <header className="drg-sheet-toolbar"><Link href="/agent-dashboard">← Volver al panel</Link><div><Link href={"/propiedad/"+property.id} target="_blank">Ver propiedad</Link><button onClick={()=>void downloadPdf()} disabled={generating}><Download size={15}/>{generating?"Generando…":"Descargar PDF"}</button></div></header>
    <main className="drg-sheet-stage">
      <article className="drg-sheet-a4" ref={sheetRef}>
        <section className={"drg-sheet-hero"+(!cover?" is-empty":"")}>
          {cover?<img src={proxy(cover)} alt={property.title} crossOrigin="anonymous"/>:null}
          <div className="drg-sheet-hero-shade"/>
          <div className="drg-sheet-hero-brand"><div className="drg-sheet-diamond">◆</div><span>DIAMANTES REALTY GROUP</span></div>
          <div className="drg-sheet-hero-copy"><small>Ficha técnica inmobiliaria</small><h1>{property.typeLabel||"Propiedad"} en {operation(property.operation).toLowerCase()}</h1><p><MapPin size={12}/>{property.location||"Nicaragua"}</p><strong>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Precio disponible bajo consulta"}</strong></div>
        </section>

        <section className="drg-sheet-gallery">{gallery.length?gallery.map((url,index)=><img key={url} src={proxy(url)} alt={"Imagen "+(index+2)} crossOrigin="anonymous"/>):Array.from({length:4},(_,index)=><div key={index}>Imagen secundaria</div>)}</section>

        <section className="drg-sheet-content">
          <div className="drg-sheet-feature-section"><h2>Características principales</h2><div>{features.map(feature=><article key={feature.label}><small>{feature.label}</small><strong>{feature.value}</strong></article>)}</div></div>
          <div className="drg-sheet-info-grid">
            <section><h2>Información general</h2><dl><div><dt>Título</dt><dd>{property.title}</dd></div><div><dt>Ubicación</dt><dd>{property.location||"Nicaragua"}</dd></div><div><dt>Operación</dt><dd>{operation(property.operation)}</dd></div><div><dt>Tipo</dt><dd>{property.typeLabel}</dd></div><div><dt>Estado</dt><dd>{property.status}</dd></div></dl></section>
            <section><h2>Descripción</h2><p>{property.description||"Información descriptiva pendiente de actualización."}</p></section>
          </div>
        </section>

        <footer className="drg-sheet-footer">
          <section className="drg-sheet-agent">
            {agent?.photo?<img src={proxy(agent.photo)} alt={name} crossOrigin="anonymous"/>:<div>{name.split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</div>}
            <span><small>Agente responsable</small><strong>{name}</strong><em>{agent?.role||"Asesor inmobiliario"}</em></span>
            <ul>{phone?<li><Phone size={11}/>{phone}</li>:null}{email?<li><Mail size={11}/>{email}</li>:null}{whatsapp?<li>WhatsApp · {whatsapp}</li>:null}</ul>
          </section>
          <div className="drg-sheet-footer-brand"><strong>DIAMANTES</strong><span>REALTY GROUP</span><p>¡Visita, conoce e invierte en Nicaragua!</p></div>
          <p className="drg-sheet-note">La información contenida en esta ficha es aproximada y puede estar sujeta a cambios sin previo aviso.</p>
        </footer>
      </article>
    </main>
  </div>;
}
