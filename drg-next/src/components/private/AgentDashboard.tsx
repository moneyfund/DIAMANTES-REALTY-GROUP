"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { readAgentProperties, saveAgentProperty, markAgentPropertySold, deleteAgentProperty } from "@/lib/firebase/private-properties";
import { saveAgentProfile, type AgentProfileDraft } from "@/lib/firebase/private-agents";
import { emptyAgentPropertyDraft, propertyToDraft, validateContractDates, type AgentPropertyDraft } from "@/lib/properties/private";
import { getDynamicFieldsForType } from "@/lib/properties/fields";
import type { Property } from "@/types/property";

type View="inicio"|"perfil"|"propiedad"|"inventario";
const departments=["Boaco","Carazo","Chinandega","Chontales","Estelí","Granada","Jinotega","León","Madriz","Managua","Masaya","Matagalpa","Nueva Segovia","Rivas","Río San Juan"];
const propertyTypes=[["house","Casa"],["apartment","Apartamento"],["land","Terreno"],["farm","Finca"],["quinta","Quinta"],["warehouse","Bodega"],["commercial","Comercial"],["office","Oficina"],["investment","Inversión"],["other","Otro"]] as const;

function n(value:unknown){const number=Number(value);return Number.isFinite(number)&&String(value).trim()!==""?number:null}
function publicationLabel(property:Property){
  const status=String(property.raw.publicationStatus||"approved");
  return ({pending_review:"Pendiente",approved:"Publicada",rejected:"Rechazada",draft:"Borrador",archived:"Archivada"} as Record<string,string>)[status]||status;
}
function propertyDate(property:Property){
  const value=property.raw.updatedAt||property.raw.createdAt;
  if(value&&typeof value==="object"&&"seconds" in value)return Number((value as {seconds?:unknown}).seconds||0);
  return 0;
}

function DynamicFields({draft,setDraft}:{draft:AgentPropertyDraft;setDraft:(next:AgentPropertyDraft)=>void}){
  const fields=getDynamicFieldsForType(draft.type);
  if(!fields.length)return null;
  return <fieldset className="drg-agent-editor-section"><legend>Características específicas</legend><div className="drg-agent-form-grid">
    {fields.map(([key,input,label,options])=>{
      const value=draft.details[key]??"";
      const set=(next:string)=>setDraft({...draft,details:{...draft.details,[key]:input==="number"?(n(next)??""):next}});
      if(input==="select")return <label key={key}>{label}<select value={String(value)} onChange={e=>set(e.target.value)}><option value="">Seleccionar</option>{options?.map(option=><option key={option}>{option}</option>)}</select></label>;
      if(input==="textarea")return <label key={key} className="is-wide">{label}<textarea rows={3} value={String(value)} onChange={e=>set(e.target.value)}/></label>;
      return <label key={key}>{label}<input type={input} min={input==="number"?"0":undefined} step={input==="number"?"0.01":undefined} value={String(value)} onChange={e=>set(e.target.value)}/></label>;
    })}
  </div></fieldset>;
}

export function AgentDashboard() {
  const {profile,logout,refresh}=useDrgAuth();
  const [view,setView]=useState<View>("inicio");
  const [properties,setProperties]=useState<Property[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [editingId,setEditingId]=useState("");
  const [draft,setDraft]=useState<AgentPropertyDraft>(emptyAgentPropertyDraft());
  const [profileDraft,setProfileDraft]=useState<AgentProfileDraft>({
    name:"",description:"",email:"",phone:"",licenseNumber:"",instagram:"",facebook:"",tiktok:"",whatsapp:""
  });

  const user=profile.user;
  const agent=profile.agent;

  async function reload(){
    if(!user)return;
    setLoading(true);
    try{setProperties((await readAgentProperties(user,agent)).sort((a,b)=>propertyDate(b)-propertyDate(a)));}
    catch(error){console.error(error);setMessage("No fue posible cargar el inventario privado.");}
    finally{setLoading(false)}
  }

  useEffect(()=>{void reload()},[user?.uid,agent?.id]);
  useEffect(()=>{
    setProfileDraft({
      name:agent?.name||user?.displayName||"",
      description:agent?.description||"",
      email:agent?.email||user?.email||"",
      phone:agent?.phone||"",
      licenseNumber:agent?.license||"",
      instagram:agent?.instagram||"",facebook:agent?.facebook||"",tiktok:agent?.tiktok||"",whatsapp:agent?.whatsapp||""
    });
  },[agent,user]);

  const stats=useMemo(()=>({
    total:properties.length,
    published:properties.filter(p=>p.publicVisible).length,
    pending:properties.filter(p=>String(p.raw.publicationStatus)==="pending_review").length,
    sold:properties.filter(p=>["sold","vendida"].includes(String(p.status))).length
  }),[properties]);

  function editProperty(property:Property){
    setEditingId(property.id);setDraft(propertyToDraft(property));setView("propiedad");setMessage("");
  }
  function newProperty(){setEditingId("");setDraft(emptyAgentPropertyDraft());setView("propiedad");setMessage("")}

  async function submitProfile(event:FormEvent){
    event.preventDefault();
    if(!user)return;
    if(!drgWritesEnabled){setMessage("La edición está preparada, pero las escrituras siguen bloqueadas en esta Preview.");return}
    try{await saveAgentProfile(user,agent?.id,profileDraft);await refresh();setMessage("Perfil guardado correctamente.");}
    catch(error){setMessage(error instanceof Error?error.message:"No fue posible guardar el perfil.");}
  }

  async function submitProperty(event:FormEvent){
    event.preventDefault();
    if(!user)return;
    const contract=validateContractDates(draft.contractStartDate,draft.contractEndDate);
    if(!contract.valid){setMessage(contract.message);return}
    if(!draft.title.trim()||!draft.location.trim()||draft.priceUsd<=0){setMessage("Título, ubicación y precio son obligatorios.");return}
    if(!drgWritesEnabled){setMessage("El formulario ya está listo, pero el guardado sigue bloqueado hasta aprobar las reglas nuevas.");return}
    try{
      const id=await saveAgentProperty({id:editingId||undefined,draft,user,agent});
      setEditingId(id);await reload();setMessage(editingId?"Propiedad actualizada.":"Propiedad enviada a revisión.");
    }catch(error){setMessage(error instanceof Error?error.message:"No fue posible guardar la propiedad.")}
  }

  async function markSold(property:Property){
    if(!user)return;
    if(!drgWritesEnabled){setMessage("Acción bloqueada en modo de migración.");return}
    if(!window.confirm("¿Marcar esta propiedad como vendida?"))return;
    try{await markAgentPropertySold(property.id,user,agent);await reload();setMessage("Propiedad marcada como vendida.");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible actualizarla.")}
  }

  async function remove(property:Property){
    if(!user)return;
    if(!drgWritesEnabled){setMessage("Eliminación bloqueada en modo de migración.");return}
    if(!window.confirm("¿Eliminar permanentemente esta propiedad?"))return;
    try{await deleteAgentProperty(property.id,user,agent);await reload();setMessage("Propiedad eliminada.");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible eliminarla.")}
  }

  return <section className="drg-agent-app">
    <aside className="drg-agent-sidebar">
      <Link className="drg-agent-sidebar-brand" href="/"><strong>DIAMANTES</strong><span>Realty Group</span></Link>
      <div className="drg-agent-sidebar-person"><div>{(agent?.name||user?.displayName||"DR").split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}</div><strong>{agent?.name||user?.displayName||"Agente DRG"}</strong><span>{user?.email}</span></div>
      <nav>
        <button className={view==="inicio"?"is-active":""} onClick={()=>setView("inicio")}>Inicio</button>
        <button className={view==="perfil"?"is-active":""} onClick={()=>setView("perfil")}>Mi perfil</button>
        <button className={view==="propiedad"?"is-active":""} onClick={newProperty}>Subir propiedad</button>
        <button className={view==="inventario"?"is-active":""} onClick={()=>setView("inventario")}>Mis propiedades</button>
      </nav>
      <div className="drg-agent-sidebar-foot"><span className={drgWritesEnabled?"is-write":"is-readonly"}>{drgWritesEnabled?"Escritura habilitada":"Modo seguro · solo lectura"}</span><button onClick={()=>void logout()}>Cerrar sesión</button></div>
    </aside>

    <main className="drg-agent-workspace">
      <header className="drg-agent-topbar"><div><p className="drg-kicker">Panel de agente · DRG 2.0</p><h1>{view==="inicio"?"Resumen":view==="perfil"?"Perfil profesional":view==="propiedad"?(editingId?"Editar propiedad":"Nueva propiedad"):"Mis propiedades"}</h1></div><button onClick={()=>void reload()}>Actualizar datos</button></header>
      {message?<div className="drg-agent-message">{message}<button onClick={()=>setMessage("")}>×</button></div>:null}

      {view==="inicio"?<section className="drg-agent-home">
        <div className="drg-private-stats"><article><strong>{stats.total}</strong><span>Propiedades</span></article><article><strong>{stats.published}</strong><span>Publicadas</span></article><article><strong>{stats.pending}</strong><span>Pendientes</span></article><article><strong>{stats.sold}</strong><span>Vendidas</span></article></div>
        <div className="drg-agent-home-grid"><article><p className="drg-kicker">Estado de migración</p><h2>Tu panel ya reconoce tu inventario real</h2><p>La arquitectura nueva consulta propiedades asociadas a tu UID y correo, manteniendo compatibilidad con los documentos existentes.</p><button onClick={()=>setView("inventario")}>Revisar inventario</button></article><article><p className="drg-kicker">Seguridad</p><h2>Las mutaciones siguen bloqueadas</h2><p>Perfil, propiedades y Storage están preparados en código, pero no podrán escribir hasta validar reglas y activar explícitamente la bandera de escritura.</p></article></div>
      </section>:null}

      {view==="perfil"?<form className="drg-agent-editor" onSubmit={submitProfile}>
        <fieldset className="drg-agent-editor-section"><legend>Información pública</legend><div className="drg-agent-form-grid">
          <label>Nombre<input value={profileDraft.name} onChange={e=>setProfileDraft({...profileDraft,name:e.target.value})}/></label>
          <label>Correo<input type="email" value={profileDraft.email} onChange={e=>setProfileDraft({...profileDraft,email:e.target.value})}/></label>
          <label>Teléfono<input value={profileDraft.phone} onChange={e=>setProfileDraft({...profileDraft,phone:e.target.value})}/></label>
          <label>Carnet profesional<input value={profileDraft.licenseNumber} onChange={e=>setProfileDraft({...profileDraft,licenseNumber:e.target.value})}/></label>
          <label className="is-wide">Descripción<textarea rows={5} value={profileDraft.description} onChange={e=>setProfileDraft({...profileDraft,description:e.target.value})}/></label>
        </div></fieldset>
        <fieldset className="drg-agent-editor-section"><legend>Redes y contacto</legend><div className="drg-agent-form-grid">
          <label>WhatsApp<input value={profileDraft.whatsapp} onChange={e=>setProfileDraft({...profileDraft,whatsapp:e.target.value})}/></label>
          <label>Instagram<input value={profileDraft.instagram} onChange={e=>setProfileDraft({...profileDraft,instagram:e.target.value})}/></label>
          <label>Facebook<input value={profileDraft.facebook} onChange={e=>setProfileDraft({...profileDraft,facebook:e.target.value})}/></label>
          <label>TikTok<input value={profileDraft.tiktok} onChange={e=>setProfileDraft({...profileDraft,tiktok:e.target.value})}/></label>
        </div></fieldset>
        <div className="drg-agent-editor-actions"><button type="submit">{drgWritesEnabled?"Guardar perfil":"Guardar bloqueado en Preview"}</button><Link href={agent?"/agente/"+agent.id:"/agentes"} target="_blank">Ver perfil público</Link></div>
      </form>:null}

      {view==="propiedad"?<form className="drg-agent-editor" onSubmit={submitProperty}>
        <fieldset className="drg-agent-editor-section"><legend>01 · Información general</legend><div className="drg-agent-form-grid">
          <label className="is-wide">Título<input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <label>Precio USD<input required type="number" min="1" step="0.01" value={draft.priceUsd||""} onChange={e=>setDraft({...draft,priceUsd:Number(e.target.value)||0})}/></label>
          <label>Departamento<select value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})}><option value="">Seleccionar</option>{departments.map(d=><option key={d}>{d}</option>)}</select></label>
          <label className="is-wide">Ubicación<input required value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="Ciudad, barrio, referencia"/></label>
          <label>Tipo<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value,details:{}})}>{propertyTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Operación<select value={draft.operation} onChange={e=>setDraft({...draft,operation:e.target.value})}><option value="venta">Venta</option><option value="alquiler">Alquiler</option><option value="venta_renta">Venta / Renta</option></select></label>
          <label>Estado comercial<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="available">Disponible</option><option value="reserved">Reservada</option><option value="sold">Vendida</option><option value="rented">Rentada</option></select></label>
          <label>Visibilidad<select value={draft.visibility} onChange={e=>setDraft({...draft,visibility:e.target.value as AgentPropertyDraft["visibility"]})}><option value="public">Público</option><option value="agents">Solo agentes</option><option value="private">Solo yo</option></select></label>
          <label className="is-wide">Descripción<textarea rows={6} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
        </div></fieldset>

        <DynamicFields draft={draft} setDraft={setDraft}/>

        <fieldset className="drg-agent-editor-section"><legend>03 · Ubicación y contrato</legend><div className="drg-agent-form-grid">
          <label>Latitud<input type="number" step="any" value={draft.lat??""} onChange={e=>setDraft({...draft,lat:n(e.target.value)})}/></label>
          <label>Longitud<input type="number" step="any" value={draft.lng??""} onChange={e=>setDraft({...draft,lng:n(e.target.value)})}/></label>
          <label>Emisión de contrato<input type="date" value={draft.contractStartDate} onChange={e=>setDraft({...draft,contractStartDate:e.target.value})}/></label>
          <label>Vencimiento de contrato<input type="date" value={draft.contractEndDate} onChange={e=>setDraft({...draft,contractEndDate:e.target.value})}/></label>
        </div></fieldset>

        <fieldset className="drg-agent-editor-section"><legend>04 · Multimedia</legend><div className="drg-agent-form-grid">
          <label>Tipo de video<select value={draft.videoType} onChange={e=>setDraft({...draft,videoType:e.target.value as AgentPropertyDraft["videoType"]})}><option value="">Sin video</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select></label>
          <label>URL de video<input type="url" value={draft.videoUrl} onChange={e=>setDraft({...draft,videoUrl:e.target.value})}/></label>
          <label className="is-wide">Imágenes actuales / URLs<textarea rows={5} value={draft.images.join("\n")} onChange={e=>{const images=e.target.value.split(/\n+/).map(v=>v.trim()).filter(Boolean);setDraft({...draft,images,coverImage:images.includes(draft.coverImage)?draft.coverImage:(images[0]||"")})}} placeholder="Una URL por línea"/></label>
          {draft.images.length?<label className="is-wide">Imagen de portada<select value={draft.coverImage} onChange={e=>setDraft({...draft,coverImage:e.target.value})}>{draft.images.map((image,index)=><option value={image} key={image}>Imagen {index+1}</option>)}</select></label>:null}
          <label className="is-wide drg-agent-upload-placeholder">Subida directa desde dispositivo<input type="file" accept="image/*" multiple disabled={!drgWritesEnabled}/><span>{drgWritesEnabled?"El uploader se conectará a Storage al guardar.":"Deshabilitado mientras DRG 2.0 permanezca en modo seguro."}</span></label>
        </div></fieldset>

        <div className="drg-agent-editor-actions"><button type="submit">{drgWritesEnabled?(editingId?"Actualizar propiedad":"Enviar a revisión"):"Guardado bloqueado en Preview"}</button>{editingId?<button type="button" className="is-secondary" onClick={()=>{setEditingId("");setDraft(emptyAgentPropertyDraft())}}>Cancelar edición</button>:null}</div>
      </form>:null}

      {view==="inventario"?<section className="drg-agent-inventory">
        <header><div><p>{loading?"Cargando…":properties.length+" propiedades asociadas a tu cuenta"}</p></div><button onClick={newProperty}>Nueva propiedad</button></header>
        <div className="drg-agent-inventory-list">{properties.map(property=><article key={property.id}>
          <div className="drg-agent-inventory-image">{property.coverImage?<img src={property.coverImage} alt=""/>:<span>DRG</span>}</div>
          <div><span className={"drg-agent-publication is-"+String(property.raw.publicationStatus||"approved")}>{publicationLabel(property)}</span><h2>{property.title}</h2><p>{property.location}</p><strong>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Precio no disponible"}</strong><small>{property.typeLabel} · {property.operation==="alquiler"?"Alquiler":"Venta"} · {String(property.raw.visibility||"public")}</small></div>
          <div className="drg-agent-inventory-actions"><button onClick={()=>editProperty(property)}>Editar</button><Link href={"/propiedad/"+property.id} target="_blank">Vista pública</Link><button onClick={()=>void markSold(property)}>Marcar vendida</button><button className="is-danger" onClick={()=>void remove(property)}>Eliminar</button></div>
        </article>)}</div>
        {!loading&&!properties.length?<div className="drg-agent-empty">No encontramos propiedades asociadas a esta cuenta.</div>:null}
      </section>:null}
    </main>
  </section>;
}
