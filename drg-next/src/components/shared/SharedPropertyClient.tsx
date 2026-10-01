"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { readSharedListByToken, readShareablePropertiesByIds, type SharedPropertyList } from "@/lib/firebase/shared-lists";
import { readAgentById } from "@/lib/firebase/agents";
import { getPropertyCoordinates, getPropertyFeatures, getPropertyVideo } from "@/lib/properties/detail";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { PropertyDetailGallery } from "@/components/properties/PropertyDetailGallery";

function waHref(phone:string,message:string){const digits=String(phone||"").replace(/\D/g,"");return digits?"https://wa.me/"+digits+"?text="+encodeURIComponent(message):""}
function operationLabel(value:string){return value==="alquiler"?"Alquiler":value==="venta_renta"?"Venta / Renta":"Venta"}

export function SharedPropertyClient({token,propertyId}:{token:string;propertyId:string}){
  const [list,setList]=useState<SharedPropertyList|null>(null);const [property,setProperty]=useState<Property|null>(null);const [agent,setAgent]=useState<Agent|null>(null);
  const [status,setStatus]=useState<"loading"|"ready"|"missing"|"error">("loading");
  useEffect(()=>{let cancelled=false;void (async()=>{
    try{
      const item=await readSharedListByToken(token);
      if(cancelled)return;
      if(!item||item.status!=="active"||!item.propertyIds.includes(propertyId)){setStatus("missing");return}
      const [props,resolved]=await Promise.all([readShareablePropertiesByIds([propertyId]),item.createdByAgentId?readAgentById(item.createdByAgentId):Promise.resolve(null)]);
      if(cancelled)return;
      const found=props[0];if(!found){setStatus("missing");return}
      setList(item);setProperty(found);setAgent(resolved);setStatus("ready");
    }catch(error){console.error("[DRG shared property]",error);if(!cancelled)setStatus("error")}
  })();return()=>{cancelled=true}},[token,propertyId]);

  const features=useMemo(()=>property?getPropertyFeatures(property):[],[property]);
  const coords=useMemo(()=>property?getPropertyCoordinates(property):null,[property]);
  const video=useMemo(()=>property?getPropertyVideo(property):null,[property]);

  if(status==="loading")return <div className="drg-shared-state"><p className="drg-kicker">Ficha privada</p><h1>Preparando propiedad…</h1></div>;
  if(status!=="ready"||!list||!property)return <div className="drg-shared-state"><p className="drg-kicker">Ficha privada</p><h1>Detalle no disponible</h1><p>La propiedad no forma parte de una selección activa o ya no está disponible.</p><Link href={"/share?token="+encodeURIComponent(token)}>Volver a la selección</Link></div>;

  const advisor={name:list.createdByAgentName||agent?.name||"Asesor inmobiliario",email:list.createdByAgentEmail||agent?.email||"",phone:list.createdByAgentWhatsapp||list.createdByAgentPhone||agent?.whatsapp||agent?.phone||"",photo:list.createdByAgentPhoto||agent?.photo||""};
  const message=`Hola ${advisor.name}, me interesa la propiedad “${property.title}” de la selección que me compartiste. Quiero más información.`;
  const whatsapp=waHref(advisor.phone,message);
  const mapUrl=coords?"https://www.openstreetmap.org/export/embed.html?bbox="+(coords[1]-.02)+"%2C"+(coords[0]-.015)+"%2C"+(coords[1]+.02)+"%2C"+(coords[0]+.015)+"&layer=mapnik&marker="+coords[0]+"%2C"+coords[1]:"";

  return <div className="drg-shared-page">
    <header className="drg-shared-shell-header"><Link href="/" className="drg-shared-shell-brand"><img src="/assets/logo.png" alt="Diamantes Realty Group"/><span><strong>Diamantes Realty Group</strong><small>Real Estate · Nicaragua</small></span></Link><em>Ficha privada</em></header>
    <main className="drg-shared-shell-main">
      <div className="drg-shared-back"><Link href={"/share?token="+encodeURIComponent(token)}>← Volver a la selección</Link><span>Consulta siempre con el asesor que te compartió esta lista.</span></div>
      <section className="drg-shared-detail-top"><PropertyDetailGallery images={property.images.length?property.images:(property.coverImage?[property.coverImage]:[])} title={property.title}/><aside><p className="drg-kicker">{property.typeLabel} · {operationLabel(property.operation)}</p><h1>{property.title}</h1><p className="drg-shared-detail-location"><MapPin size={14}/>{property.location}</p><strong className="drg-shared-detail-price">{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Precio bajo consulta"}</strong><div className="drg-shared-advisor">{advisor.photo?<img src={advisor.photo} alt=""/>:<span>{advisor.name.split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}</span>}<div><small>Asesor de tu selección</small><strong>{advisor.name}</strong>{advisor.email?<em>{advisor.email}</em>:null}</div></div>{whatsapp?<a className="drg-shared-contact-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15}/> Consultar esta propiedad</a>:advisor.email?<a className="drg-shared-contact-primary" href={"mailto:"+advisor.email}><Mail size={15}/> Contactar asesor</a>:null}</aside></section>
      <section className="drg-shared-detail-content">
        {property.description?<article><p className="drg-kicker">Información</p><h2>Descripción de la propiedad</h2><p>{property.description}</p></article>:null}
        {features.length?<article><p className="drg-kicker">Datos principales</p><h2>Características</h2><div className="drg-shared-feature-grid">{features.map(feature=><div key={feature.label}><small>{feature.label}</small><strong>{feature.value}</strong></div>)}</div></article>:null}
        {video?<article><p className="drg-kicker">Contenido multimedia</p><h2>Recorrido en video</h2><div className="drg-shared-video"><iframe src={video.embedUrl} title={"Video de "+property.title} allowFullScreen/></div></article>:null}
        {mapUrl?<article><p className="drg-kicker">Referencia geográfica</p><h2>Ubicación</h2><iframe className="drg-shared-map" src={mapUrl} title={"Mapa de "+property.title}/></article>:null}
      </section>
    </main>
    <footer className="drg-shared-shell-footer"><strong>Diamantes Realty Group</strong><span>Información inmobiliaria privada</span></footer>
  </div>;
}
