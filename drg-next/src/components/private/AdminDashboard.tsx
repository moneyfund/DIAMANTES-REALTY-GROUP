"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { approvePropertyAsAdmin, deleteFormAsAdmin, deletePropertyAsAdmin, readAdminForms, readAllAdminAgents, readAllAdminProperties, readListingAudit, rejectPropertyAsAdmin, renameAgentAsAdmin, updateFormStatusAsAdmin, type AdminFormItem, type ListingAuditRecord } from "@/lib/firebase/admin-data";
import { deleteStorageReference } from "@/lib/firebase/private-storage";
import { AdminPropertyEditor } from "./AdminPropertyEditor";
import { getContractStatus } from "@/lib/properties/private";
import type { Property } from "@/types/property";
import type { Agent } from "@/types/agent";

type View="resumen"|"revision"|"propiedades"|"agentes"|"formularios";
const formStatusLabels:{[key:string]:string}={nuevo:"Nuevo",leido:"Leído",respondido:"Respondido",archivado:"Archivado"};

function ts(value:unknown){
  if(value&&typeof value==="object"&&"seconds" in value)return Number((value as {seconds?:unknown}).seconds||0);
  if(value instanceof Date)return value.getTime()/1000;
  return 0;
}
function dateText(value:unknown){
  const seconds=ts(value); if(!seconds)return "Sin fecha";
  return new Intl.DateTimeFormat("es-NI",{dateStyle:"medium",timeStyle:"short"}).format(new Date(seconds*1000));
}
function publication(property:Property){return String(property.raw.publicationStatus|| (property.publicVisible?"approved":"pending_review"))}

export function AdminDashboard(){
  const {profile,logout}=useDrgAuth();
  const [view,setView]=useState<View>("resumen");
  const [properties,setProperties]=useState<Property[]>([]);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [forms,setForms]=useState<AdminFormItem[]>([]);
  const [audit,setAudit]=useState<Record<string,ListingAuditRecord>>({});
  const [editingProperty,setEditingProperty]=useState<Property|null>(null);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [selectedForm,setSelectedForm]=useState<AdminFormItem|null>(null);
  const [reviewDetail,setReviewDetail]=useState<Property|null>(null);
  const [search,setSearch]=useState("");
  const [formStatus,setFormStatus]=useState("");
  const [propertyStatus,setPropertyStatus]=useState("");

  async function reload(){
    setLoading(true);
    try{
      const [p,a,f,trace]=await Promise.all([readAllAdminProperties(),readAllAdminAgents(),readAdminForms(),readListingAudit()]);
      setProperties(p.sort((x,y)=>ts(y.raw.updatedAt||y.raw.createdAt)-ts(x.raw.updatedAt||x.raw.createdAt)));
      setAgents(a.sort((x,y)=>x.name.localeCompare(y.name,"es")));
      setForms(f.sort((x,y)=>ts(y.createdAt)-ts(x.createdAt)));setAudit(trace);
    }catch(error){console.error(error);setMessage("No fue posible cargar todos los datos administrativos.");}
    finally{setLoading(false)}
  }
  useEffect(()=>{void reload()},[]);

  const counts=useMemo(()=>({
    total:properties.length,
    pending:properties.filter(p=>publication(p)==="pending_review").length,
    approved:properties.filter(p=>publication(p)==="approved").length,
    rejected:properties.filter(p=>publication(p)==="rejected").length,
    agents:agents.filter(a=>a.active).length,
    newForms:forms.filter(f=>f.estado==="nuevo").length
  }),[properties,agents,forms]);

  const pending=useMemo(()=>properties.filter(p=>publication(p)==="pending_review"),[properties]);
  const filteredProperties=useMemo(()=>properties.filter(property=>{
    const hay=[property.title,property.location,property.typeLabel,String(property.raw.agentName||"")].join(" ").toLowerCase();
    return (!search||hay.includes(search.toLowerCase()))&&(!propertyStatus||publication(property)===propertyStatus);
  }),[properties,search,propertyStatus]);
  const filteredForms=useMemo(()=>forms.filter(form=>{
    const hay=[form.nombre,form.correo,form.telefono,form.mensaje,form.tipo].join(" ").toLowerCase();
    return (!search||hay.includes(search.toLowerCase()))&&(!formStatus||form.estado===formStatus);
  }),[forms,search,formStatus]);

  async function approve(property:Property){
    if(!profile.user)return;
    if(!drgWritesEnabled){setMessage("Aprobación bloqueada: las reglas nuevas aún no se han desplegado.");return}
    if(!window.confirm("¿Aprobar y publicar esta propiedad?"))return;
    try{await approvePropertyAsAdmin(property.id,profile.user);await reload();setMessage("Propiedad aprobada.");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible aprobarla.")}
  }
  async function reject(property:Property){
    if(!profile.user)return;
    const reason=window.prompt("Motivo de rechazo:");
    if(!reason)return;
    if(!drgWritesEnabled){setMessage("Rechazo bloqueado en Preview. El motivo no fue enviado.");return}
    try{await rejectPropertyAsAdmin(property.id,profile.user,reason);await reload();setMessage("Propiedad rechazada.");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible rechazarla.")}
  }
  async function rename(agent:Agent){
    const name=window.prompt("Nombre público del agente:",agent.name); if(!name||name.trim()===agent.name)return;
    if(!drgWritesEnabled){setMessage("Edición de agentes bloqueada en Preview.");return}
    try{await renameAgentAsAdmin(agent.id,name);await reload();setMessage("Nombre del agente actualizado.");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible actualizarlo.")}
  }
  async function formState(item:AdminFormItem,status:string){
    if(!drgWritesEnabled){setMessage("Cambio de estado bloqueado en Preview.");return}
    try{await updateFormStatusAsAdmin(item.id,status);await reload();setSelectedForm(current=>current?.id===item.id?{...current,estado:status}:current);}catch(error){setMessage(error instanceof Error?error.message:"No fue posible actualizar el formulario.")}
  }
  async function removeProperty(property:Property){
    if(!drgWritesEnabled){setMessage("Eliminación de propiedades bloqueada en Preview.");return}
    if(!window.confirm("¿Eliminar permanentemente esta propiedad, sus comentarios y reseñas?"))return;
    try{
      const targets=await deletePropertyAsAdmin(property.id);
      for(const target of targets){
        try{await deleteStorageReference(target)}
        catch(error){console.warn("[DRG admin storage cleanup]",target,error)}
      }
      setEditingProperty(null);setReviewDetail(null);await reload();setMessage("Propiedad eliminada.");
    }catch(error){setMessage(error instanceof Error?error.message:"No fue posible eliminar la propiedad.")}
  }
  async function removeForm(item:AdminFormItem){
    if(!drgWritesEnabled){setMessage("Eliminación bloqueada en Preview.");return}
    if(!window.confirm("¿Eliminar este formulario permanentemente?"))return;
    try{await deleteFormAsAdmin(item.id);setSelectedForm(null);await reload();}catch(error){setMessage(error instanceof Error?error.message:"No fue posible eliminarlo.")}
  }

  const nav=(target:View,label:string,badge?:number)=><button className={view===target?"is-active":""} onClick={()=>{setView(target);setSearch("")}}>{label}{badge?<span>{badge}</span>:null}</button>;

  return <section className="drg-admin-app">
    <aside className="drg-admin-sidebar">
      <Link href="/" className="drg-admin-brand"><strong>DIAMANTES</strong><span>Administration · DRG 2.0</span></Link>
      <nav>{nav("resumen","Resumen")}{nav("revision","Revisión",counts.pending)}{nav("propiedades","Propiedades")}{nav("agentes","Agentes")}{nav("formularios","Formularios",counts.newForms)}</nav>
      <div className="drg-admin-sidebar-foot"><span>{drgWritesEnabled?"Escrituras activas":"Modo seguro · solo lectura"}</span><small>{profile.user?.email}</small><button onClick={()=>void logout()}>Cerrar sesión</button></div>
    </aside>
    <main className="drg-admin-workspace">
      <header className="drg-admin-topbar"><div><p className="drg-kicker">Panel administrativo</p><h1>{({resumen:"Resumen ejecutivo",revision:"Revisión editorial",propiedades:"Inventario",agentes:"Agentes",formularios:"Bandeja de formularios"} as Record<View,string>)[view]}</h1></div><button onClick={()=>void reload()}>{loading?"Actualizando…":"Actualizar"}</button></header>
      {message?<div className="drg-agent-message">{message}<button onClick={()=>setMessage("")}>×</button></div>:null}

      {view==="resumen"?<section className="drg-admin-overview">
        <div className="drg-admin-stats"><article><strong>{counts.total}</strong><span>Propiedades</span></article><article><strong>{counts.pending}</strong><span>Pendientes</span></article><article><strong>{counts.approved}</strong><span>Publicadas</span></article><article><strong>{counts.agents}</strong><span>Agentes activos</span></article><article><strong>{counts.newForms}</strong><span>Formularios nuevos</span></article></div>
        <div className="drg-admin-overview-grid"><article><p className="drg-kicker">Control editorial</p><h2>{counts.pending?counts.pending+" propiedades esperan revisión":"Sin pendientes de revisión"}</h2><p>La cola nueva ya interpreta los mismos estados de publicación utilizados por producción.</p><button onClick={()=>setView("revision")}>Abrir revisión</button></article><article><p className="drg-kicker">Migración segura</p><h2>La administración ya está conectada en lectura</h2><p>Las mutaciones permanecen bloqueadas hasta la validación final de Auth y reglas Firestore/Storage.</p></article></div>
      </section>:null}

      {view==="revision"?<section className="drg-admin-review"><div className="drg-admin-review-stats"><span>Pendientes <b>{counts.pending}</b></span><span>Aprobadas <b>{counts.approved}</b></span><span>Rechazadas <b>{counts.rejected}</b></span></div><div className="drg-admin-review-list">{pending.map(property=><article key={property.id}>
        <div className="drg-admin-review-image">{property.coverImage?<img src={property.coverImage} alt=""/>:<span>DRG</span>}</div><div><span>Pendiente de revisión</span><h2>{property.title}</h2><p>{property.location}</p><dl><div><dt>Tipo</dt><dd>{property.typeLabel}</dd></div><div><dt>Precio</dt><dd>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US"):"—"}</dd></div><div><dt>Agente</dt><dd>{String(property.raw.agentName||"Sin agente")}</dd></div><div><dt>Enviado</dt><dd>{dateText(property.raw.submittedAt||property.raw.createdAt)}</dd></div>{audit[property.id]?<div className="drg-admin-audit-row"><dt>Cargada desde</dt><dd>{audit[property.id].uploadedByAgentName||audit[property.id].uploadedByAgentEmail||"No identificado"}</dd></div>:null}</dl></div><div className="drg-admin-review-actions"><button className="is-edit" onClick={()=>setReviewDetail(property)}>Detalles</button><button className="is-edit" onClick={()=>setEditingProperty(property)}>Editar</button><button onClick={()=>void approve(property)}>Aprobar</button><button className="is-reject" onClick={()=>void reject(property)}>Rechazar</button></div>
      </article>)}</div>{!pending.length?<div className="drg-agent-empty">No hay propiedades pendientes de revisión.</div>:null}</section>:null}

      {view==="propiedades"?<section className="drg-admin-table-view"><div className="drg-admin-filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar propiedad, ubicación o agente"/><select value={propertyStatus} onChange={e=>setPropertyStatus(e.target.value)}><option value="">Todos los estados</option><option value="approved">Publicada</option><option value="pending_review">Pendiente</option><option value="rejected">Rechazada</option><option value="archived">Archivada</option></select></div><div className="drg-admin-table"><div className="drg-admin-tr is-head"><span>Propiedad</span><span>Agente</span><span>Precio</span><span>Publicación</span><span>Contrato / acción</span></div>{filteredProperties.map(property=>{const contract=getContractStatus(String(property.raw.contractStartDate||""),String(property.raw.contractEndDate||""));return <div className="drg-admin-tr" key={property.id}><span><strong>{property.title}</strong><small>{property.location}</small></span><span>{String(property.raw.agentName||"—")}{audit[property.id]?<small className="drg-admin-audit-note">Carga: {audit[property.id].uploadedByAgentName||audit[property.id].uploadedByAgentEmail}</small>:null}</span><span>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US"):"—"}</span><span>{publication(property)}</span><span><small className={"drg-contract-chip is-"+contract.key}>{contract.label}</small><div className="drg-admin-row-actions"><button className="drg-admin-row-edit" onClick={()=>setReviewDetail(property)}>Detalles</button><button className="drg-admin-row-edit" onClick={()=>setEditingProperty(property)}>Editar</button><button className="drg-admin-row-edit is-danger" onClick={()=>void removeProperty(property)}>Eliminar</button></div></span></div>})}</div></section>:null}

      {view==="agentes"?<section className="drg-admin-agents-grid">{agents.map(agent=>{const ids=[agent.id,agent.raw.uid,agent.raw.userId,agent.raw.agentId].map(v=>String(v||""));const emails=[agent.email].filter(Boolean).map(v=>v.toLowerCase());const count=properties.filter(property=>{const raw=property.raw;return [raw.agentId,raw.agenteId,raw.ownerId,raw.userId,raw.createdBy].map(v=>String(v||"")).some(id=>ids.includes(id))||[raw.agentEmail,raw.ownerEmail,raw.createdByEmail].map(v=>String(v||"").toLowerCase()).some(email=>emails.includes(email))}).length;return <article key={agent.id}><div>{agent.photo?<img src={agent.photo} alt=""/>:<span>{agent.name.split(/\s+/).slice(0,2).map(v=>v[0]).join("")}</span>}</div><h2>{agent.name}</h2><p>{agent.email}</p><small>{agent.role} · {agent.location||"Nicaragua"}</small><strong className="drg-admin-agent-count">{count} propiedades</strong><button onClick={()=>void rename(agent)}>Editar nombre</button><Link href={"/agente/"+agent.id} target="_blank">Perfil público</Link></article>})}</section>:null}

      {view==="formularios"?<section className="drg-admin-forms"><div className="drg-admin-filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nombre, correo, teléfono o mensaje"/><select value={formStatus} onChange={e=>setFormStatus(e.target.value)}><option value="">Todos los estados</option>{Object.entries(formStatusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div><div className="drg-admin-form-list">{filteredForms.map(item=><button key={item.id} className={item.estado==="nuevo"?"is-new":""} onClick={()=>setSelectedForm(item)}><span><strong>{item.nombre||"Sin nombre"}</strong><small>{item.tipo==="contacto"?"Contacto":"Quiero vender"} · {item.asunto||item.tipoPropiedad||"Consulta"}</small><p>{item.mensaje.slice(0,160)}</p></span><span><small>{item.telefono}</small><small>{item.correo}</small></span><span><time>{dateText(item.createdAt)}</time><em>{formStatusLabels[item.estado]||item.estado}</em></span></button>)}</div></section>:null}

      {reviewDetail?<div className="drg-admin-modal drg-admin-review-detail-modal" onMouseDown={e=>{if(e.currentTarget===e.target)setReviewDetail(null)}}><article><button className="drg-admin-modal-close" onClick={()=>setReviewDetail(null)}>×</button><p className="drg-kicker">Detalle administrativo</p><h2>{reviewDetail.title}</h2><div className="drg-admin-review-detail-grid"><section><h3>Propiedad</h3><dl><div><dt>ID</dt><dd>{reviewDetail.id}</dd></div><div><dt>Ubicación</dt><dd>{reviewDetail.location}</dd></div><div><dt>Precio</dt><dd>{reviewDetail.priceUsd?"$"+reviewDetail.priceUsd.toLocaleString("en-US")+" USD":"—"}</dd></div><div><dt>Tipo</dt><dd>{reviewDetail.typeLabel}</dd></div><div><dt>Operación</dt><dd>{reviewDetail.operation}</dd></div><div><dt>Visibilidad</dt><dd>{String(reviewDetail.raw.visibility||"public")}</dd></div><div><dt>Publicación</dt><dd>{publication(reviewDetail)}</dd></div><div><dt>Estado</dt><dd>{reviewDetail.status}</dd></div></dl></section><section><h3>Agente y trazabilidad</h3><dl><div><dt>Agente propietario</dt><dd>{String(reviewDetail.raw.agentName||"Sin identificar")}</dd></div><div><dt>Email</dt><dd>{String(reviewDetail.raw.agentEmail||reviewDetail.raw.ownerEmail||"—")}</dd></div>{audit[reviewDetail.id]?<><div><dt>Cargada por</dt><dd>{audit[reviewDetail.id].uploadedByAgentName||audit[reviewDetail.id].uploadedByAgentEmail}</dd></div><div><dt>Propietario auditado</dt><dd>{audit[reviewDetail.id].ownerAgentName||audit[reviewDetail.id].ownerAgentEmail}</dd></div></>:null}{reviewDetail.raw.rejectionReason?<div><dt>Motivo de rechazo</dt><dd>{String(reviewDetail.raw.rejectionReason)}</dd></div>:null}</dl>{reviewDetail.raw.legalDocument&&typeof reviewDetail.raw.legalDocument==="object"&&(reviewDetail.raw.legalDocument as Record<string,unknown>).fileUrl?<a href={String((reviewDetail.raw.legalDocument as Record<string,unknown>).fileUrl)} target="_blank" rel="noreferrer">Abrir documento legal</a>:null}</section></div><div className="drg-admin-modal-actions"><Link href={"/propiedad/"+reviewDetail.id} target="_blank">Vista pública</Link><button onClick={()=>{setReviewDetail(null);setEditingProperty(reviewDetail)}}>Editar</button><button onClick={()=>void removeProperty(reviewDetail)}>Eliminar</button></div></article></div>:null}
      {editingProperty?<AdminPropertyEditor property={editingProperty} agents={agents} onClose={()=>setEditingProperty(null)} onSaved={async()=>{await reload();setEditingProperty(null)}}/>:null}
      {selectedForm?<div className="drg-admin-modal" onMouseDown={e=>{if(e.currentTarget===e.target)setSelectedForm(null)}}><article><button className="drg-admin-modal-close" onClick={()=>setSelectedForm(null)}>×</button><p className="drg-kicker">{selectedForm.tipo==="contacto"?"Contacto":"Quiero vender"}</p><h2>{selectedForm.nombre||"Sin nombre"}</h2><p>{dateText(selectedForm.createdAt)}</p><dl>{Object.entries(selectedForm.raw).filter(([key,value])=>!["createdAt","updatedAt"].includes(key)&&value!==""&&value!==null&&typeof value!=="object").map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl><label>Estado<select value={selectedForm.estado} onChange={e=>void formState(selectedForm,e.target.value)}>{Object.entries(formStatusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><div className="drg-admin-modal-actions">{selectedForm.telefono?<a href={"https://wa.me/"+selectedForm.telefono.replace(/\D/g,"")} target="_blank" rel="noreferrer">WhatsApp</a>:null}{selectedForm.correo?<a href={"mailto:"+selectedForm.correo}>Correo</a>:null}<button onClick={()=>void removeForm(selectedForm)}>Eliminar</button></div></article></div>:null}
    </main>
  </section>;
}
