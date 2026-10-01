"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { readSharedListByToken, readShareablePropertiesByIds, type SharedPropertyList } from "@/lib/firebase/shared-lists";
import { readAgentById } from "@/lib/firebase/agents";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";

function operationLabel(value:string){return value==="alquiler"?"Alquiler":value==="venta_renta"?"Venta / Renta":"Venta"}
function waHref(phone:string,message:string){
  const digits=String(phone||"").replace(/\D/g,"");
  return digits?"https://wa.me/"+digits+"?text="+encodeURIComponent(message):"";
}

export function SharedListClient({token}:{token:string}){
  const [list,setList]=useState<SharedPropertyList|null>(null);
  const [properties,setProperties]=useState<Property[]>([]);
  const [agent,setAgent]=useState<Agent|null>(null);
  const [status,setStatus]=useState<"loading"|"ready"|"missing"|"inactive"|"error">("loading");

  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      try{
        const item=await readSharedListByToken(token);
        if(cancelled)return;
        if(!item){setStatus("missing");return}
        if(item.status!=="active"){setList(item);setStatus("inactive");return}
        setList(item);
        const [items,resolvedAgent]=await Promise.all([
          readShareablePropertiesByIds(item.propertyIds),
          item.createdByAgentId?readAgentById(item.createdByAgentId):Promise.resolve(null)
        ]);
        if(cancelled)return;
        setProperties(items);setAgent(resolvedAgent);setStatus("ready");
      }catch(error){console.error("[DRG shared list]",error);if(!cancelled)setStatus("error")}
    };
    void run();
    return()=>{cancelled=true};
  },[token]);

  const advisor=useMemo(()=>({
    name:list?.createdByAgentName||agent?.name||"Asesor inmobiliario",
    email:list?.createdByAgentEmail||agent?.email||"",
    phone:list?.createdByAgentWhatsapp||list?.createdByAgentPhone||agent?.whatsapp||agent?.phone||"",
    photo:list?.createdByAgentPhoto||agent?.photo||""
  }),[list,agent]);

  if(status==="loading")return <SharedState title="Preparando tu selección…" copy="Estamos cargando las propiedades elegidas por tu asesor."/>;
  if(status==="missing")return <SharedState title="Lista no encontrada" copy="El enlace no corresponde a una selección disponible."/>;
  if(status==="inactive")return <SharedState title="Lista no disponible" copy="Esta selección fue desactivada por el asesor que la creó."/>;
  if(status==="error"||!list)return <SharedState title="No pudimos abrir la selección" copy="Intenta nuevamente o comunícate con tu asesor."/>;
  if(!properties.length)return <SharedState title="Sin propiedades disponibles" copy="Las propiedades de esta selección ya no están publicadas o disponibles."/>;

  const generalMessage=`Hola ${advisor.name}, vi la selección de propiedades que me compartiste y quiero más información.`;
  const whatsapp=waHref(advisor.phone,generalMessage);

  return <div className="drg-shared-page">
    <header className="drg-shared-shell-header"><Link href="/" className="drg-shared-shell-brand"><img src="/assets/logo.png" alt="Diamantes Realty Group"/><span><strong>Diamantes Realty Group</strong><small>Real Estate · Nicaragua</small></span></Link><em>Selección privada</em></header>
    <main className="drg-shared-shell-main">
      <section className="drg-shared-hero"><div><p className="drg-kicker">Selección inmobiliaria privada</p><h1>{list.title}</h1><p>Una selección preparada especialmente para ayudarte a comparar opciones con claridad. Revisa cada propiedad y consulta directamente con el asesor que te compartió esta lista.</p>{list.clientName?<span>Preparada para {list.clientName}</span>:null}</div><aside><div className="drg-shared-advisor">{advisor.photo?<img src={advisor.photo} alt=""/>:<span>{advisor.name.split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}</span>}<div><small>Tu asesor en esta selección</small><strong>{advisor.name}</strong>{advisor.email?<em>{advisor.email}</em>:null}</div></div>{whatsapp?<a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15}/> Consultar con mi asesor</a>:advisor.email?<a href={"mailto:"+advisor.email}><Mail size={15}/> Contactar asesor</a>:null}</aside></section>

      <section className="drg-shared-heading"><div><p className="drg-kicker">Opciones disponibles</p><h2>Explora tu selección</h2><p>Abre cada ficha para ver fotografías, descripción y características completas.</p></div><span>{properties.length} {properties.length===1?"propiedad":"propiedades"}</span></section>

      <section className="drg-shared-property-grid">{properties.map(property=>{
        const message=`Hola ${advisor.name}, me interesa la propiedad “${property.title}” de la selección que me compartiste.`;
        const direct=waHref(advisor.phone,message);
        return <article key={property.id}><Link className="drg-shared-property-media" href={"/share-property?token="+encodeURIComponent(token)+"&propertyId="+encodeURIComponent(property.id)}>{property.coverImage?<img src={property.coverImage} alt={property.title}/>:<span>DRG</span>}<em>{property.typeLabel||"Propiedad"} · {operationLabel(property.operation)}</em></Link><div className="drg-shared-property-body"><h3>{property.title}</h3><p><MapPin size={12}/>{property.location}</p><strong>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Precio bajo consulta"}</strong><div className="drg-shared-property-facts">{property.bedrooms?<span>{property.bedrooms} hab.</span>:null}{property.bathrooms?<span>{property.bathrooms} baños</span>:null}{property.area?<span>{property.area.toLocaleString("en-US")} {property.areaUnit||"m²"}</span>:null}</div><div className="drg-shared-property-actions"><Link href={"/share-property?token="+encodeURIComponent(token)+"&propertyId="+encodeURIComponent(property.id)}>Ver propiedad</Link>{direct?<a href={direct} target="_blank" rel="noreferrer">↗</a>:null}</div></div></article>
      })}</section>
    </main>
    <footer className="drg-shared-shell-footer"><strong>Diamantes Realty Group</strong><span>Selección inmobiliaria privada</span></footer>
  </div>;
}

function SharedState({title,copy}:{title:string;copy:string}){
  return <div className="drg-shared-state"><img src="/assets/logo.png" alt="Diamantes Realty Group"/><p className="drg-kicker">Selección privada</p><h1>{title}</h1><p>{copy}</p><Link href="/">Ir al inicio</Link></div>;
}
