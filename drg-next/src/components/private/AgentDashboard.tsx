"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { attachLegalDocumentToAgentProperty, readAgentProperties, reserveAgentPropertyId, saveAgentProperty, markAgentPropertySold, deleteAgentProperty, removeLegalDocumentFromAgentProperty } from "@/lib/firebase/private-properties";
import { deleteStoragePath, deleteStorageUrlIfOwned, uploadAgentProfilePhoto, uploadAgentPropertyImage, uploadLegalPdf } from "@/lib/firebase/private-storage";
import { saveAgentProfile, type AgentProfileDraft } from "@/lib/firebase/private-agents";
import { readAgents } from "@/lib/firebase/agents";
import type { Agent } from "@/types/agent";
import { emptyAgentPropertyDraft, getContractStatus, propertyToDraft, validateContractDates, type AgentPropertyDraft } from "@/lib/properties/private";
import { getDynamicFieldsForType } from "@/lib/properties/fields";
import type { Property } from "@/types/property";
import { AgentSharedLists } from "./AgentSharedLists";
import { AgentBrokerageInventory } from "./AgentBrokerageInventory";
import { AvaluosPlaceholder } from "./AvaluosPlaceholder";
import { readOwnSharedLists } from "@/lib/firebase/shared-lists";
import { PropertyLocationPicker } from "@/components/properties/PropertyLocationPicker";
import { PropertyImageManager, propertyImageFileKey } from "@/components/properties/PropertyImageManager";
import { PropertyVideoPreview } from "@/components/properties/PropertyVideoPreview";
import { validatePropertyVideo } from "@/lib/properties/video";

type View="inicio"|"perfil"|"propiedad"|"listas"|"inventario"|"red-agentes"|"avaluos";
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
  const [allAgents,setAllAgents]=useState<Agent[]>([]);
  const [listingOwnerId,setListingOwnerId]=useState("");
  const [loading,setLoading]=useState(true);
  const [sharedListCount,setSharedListCount]=useState(0);
  const [now,setNow]=useState(()=>new Date());
  const [message,setMessage]=useState("");
  const [editingId,setEditingId]=useState("");
  const [draft,setDraft]=useState<AgentPropertyDraft>(emptyAgentPropertyDraft());
  const [pendingImages,setPendingImages]=useState<File[]>([]);
  const [pendingCoverKey,setPendingCoverKey]=useState("");
  const [pendingLegalPdf,setPendingLegalPdf]=useState<File|null>(null);
  const [uploadProgress,setUploadProgress]=useState("");
  const [pendingProfilePhoto,setPendingProfilePhoto]=useState<File|null>(null);
  const [removeProfilePhoto,setRemoveProfilePhoto]=useState(false);
  const [removeExistingLegal,setRemoveExistingLegal]=useState(false);
  const [profileDraft,setProfileDraft]=useState<AgentProfileDraft>({
    name:"",description:"",email:"",phone:"",licenseNumber:"",instagram:"",facebook:"",tiktok:"",whatsapp:""
  });

  const user=profile.user;
  const agent=profile.agent;

  async function reload(){
    if(!user)return;
    setLoading(true);
    try{
      const [own,agents,lists]=await Promise.all([readAgentProperties(user,agent),readAgents(),readOwnSharedLists(user)]);
      setProperties(own.sort((a,b)=>propertyDate(b)-propertyDate(a)));setAllAgents(agents);setSharedListCount(lists.length);
      if(!listingOwnerId){
        const current=agents.find(item=>item.id===agent?.id)||agents.find(item=>item.email&&item.email.toLowerCase()===String(user.email||"").toLowerCase());
        setListingOwnerId(current?.id||agent?.id||"");
      }
    }catch(error){console.error(error);setMessage("No fue posible cargar el inventario privado.");}
    finally{setLoading(false)}
  }

  useEffect(()=>{void reload()},[user?.uid,agent?.id]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(timer)},[]);
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
    available:properties.filter(p=>String(p.status||"available")==="available").length,
    published:properties.filter(p=>p.publicVisible).length,
    pending:properties.filter(p=>String(p.raw.publicationStatus)==="pending_review").length,
    sold:properties.filter(p=>["sold","vendida"].includes(String(p.status))).length
  }),[properties]);
  const profileComplete=Boolean((agent?.name||profileDraft.name)&&(agent?.email||profileDraft.email)&&(agent?.phone||profileDraft.phone));
  const primaryArea=Number(draft.details.totalArea||draft.details.landArea||draft.details.constructionArea||draft.area||0);
  const pricePerArea=draft.priceUsd>0&&primaryArea>0?draft.priceUsd/primaryArea:null;

  function editProperty(property:Property){
    setEditingId(property.id);setDraft(propertyToDraft(property));setPendingImages([]);setPendingCoverKey("");setPendingLegalPdf(null);setRemoveExistingLegal(false);setUploadProgress("");setView("propiedad");setMessage("");
    const raw=property.raw;const ids=[raw.agentId,raw.agenteId,raw.ownerId,raw.userId,raw.createdBy].map(v=>String(v||""));const emails=[raw.agentEmail,raw.ownerEmail,raw.createdByEmail].map(v=>String(v||"").toLowerCase());
    const owner=allAgents.find(item=>[item.id,item.raw.uid,item.raw.userId,item.raw.agentId].map(v=>String(v||"")).some(id=>ids.includes(id)))||allAgents.find(item=>item.email&&emails.includes(item.email.toLowerCase()));
    setListingOwnerId(owner?.id||agent?.id||"");
  }
  function newProperty(){
    setEditingId("");setDraft(emptyAgentPropertyDraft());setPendingImages([]);setPendingCoverKey("");setPendingLegalPdf(null);setRemoveExistingLegal(false);setUploadProgress("");setView("propiedad");setMessage("");
    const current=allAgents.find(item=>item.id===agent?.id)||allAgents.find(item=>item.email&&item.email.toLowerCase()===String(user?.email||"").toLowerCase());
    setListingOwnerId(current?.id||agent?.id||"");
  }

  async function submitProfile(event:FormEvent){
    event.preventDefault();
    if(!user)return;
    if(!drgWritesEnabled){setMessage("La edición está preparada, pero las escrituras siguen bloqueadas en esta Preview.");return}
    let uploadedUrl="";
    const previousPhoto=agent?.photo||"";
    try{
      let photo=removeProfilePhoto?"":(profileDraft.photo??previousPhoto);
      if(pendingProfilePhoto){const uploaded=await uploadAgentProfilePhoto(pendingProfilePhoto,user.uid);photo=uploaded.url;uploadedUrl=uploaded.url}
      await saveAgentProfile(user,agent?.id,{...profileDraft,photo});
      if(previousPhoto&&previousPhoto!==photo){try{await deleteStorageUrlIfOwned(previousPhoto)}catch(error){console.warn("[DRG profile photo cleanup]",error)}}
      setPendingProfilePhoto(null);setRemoveProfilePhoto(false);await refresh();setMessage("Perfil guardado correctamente.");
    }catch(error){
      if(uploadedUrl){try{await deleteStorageUrlIfOwned(uploadedUrl)}catch{}}
      setMessage(error instanceof Error?error.message:"No fue posible guardar el perfil.");
    }
  }

  async function submitProperty(event:FormEvent){
    event.preventDefault();
    if(!user)return;
    const contract=validateContractDates(draft.contractStartDate,draft.contractEndDate);
    if(!contract.valid){setMessage(contract.message);return}
    const videoValidation=validatePropertyVideo(draft.videoType,draft.videoUrl);
    if(!videoValidation.valid){setMessage(videoValidation.message);return}
    if(!draft.title.trim()||!draft.location.trim()||draft.priceUsd<=0){setMessage("Título, ubicación y precio son obligatorios.");return}
    if(!drgWritesEnabled){setMessage("El formulario ya está listo, pero el guardado sigue bloqueado hasta aprobar las reglas nuevas.");return}
    const uploadedPaths:string[]=[];
    try{
      const isNew=!editingId;
      const propertyId=editingId||reserveAgentPropertyId();
      const uploadedUrls:string[]=[];
      for(let index=0;index<pendingImages.length;index+=1){
        setUploadProgress(`Subiendo imagen ${index+1} de ${pendingImages.length}…`);
        const uploaded=await uploadAgentPropertyImage(pendingImages[index],user.uid,propertyId);
        uploadedUrls.push(uploaded.url); uploadedPaths.push(uploaded.path);
      }
      const images=[...draft.images,...uploadedUrls];
      const pendingCoverIndex=pendingCoverKey?pendingImages.findIndex(file=>propertyImageFileKey(file)===pendingCoverKey):-1;
      const requestedPendingCover=pendingCoverIndex>=0?uploadedUrls[pendingCoverIndex]:"";
      const nextDraft={...draft,images,coverImage:requestedPendingCover||(draft.coverImage&&images.includes(draft.coverImage)?draft.coverImage:(images[0]||""))};
      setUploadProgress("Guardando propiedad…");
      const listingOwner=isNew?allAgents.find(item=>item.id===listingOwnerId)||agent:null;
      const id=await saveAgentProperty({id:propertyId,draft:nextDraft,user,agent,createIfMissing:isNew,listingOwner});
      if(removeExistingLegal && editingId){
        setUploadProgress("Retirando documentación legal anterior…");
        const oldPath=await removeLegalDocumentFromAgentProperty(id,user,agent);
        if(oldPath){try{await deleteStoragePath(oldPath)}catch{}}
      }
      if(pendingLegalPdf){
        setUploadProgress("Subiendo documentación legal…");
        const legal=await uploadLegalPdf(pendingLegalPdf,id);
        uploadedPaths.push(legal.path);
        await attachLegalDocumentToAgentProperty(id,user,{fileName:pendingLegalPdf.name,fileUrl:legal.url,storagePath:legal.path},agent);
      }
      setDraft(nextDraft);setEditingId(id);setPendingImages([]);setPendingCoverKey("");setPendingLegalPdf(null);setRemoveExistingLegal(false);setUploadProgress("");
      await reload();setMessage(isNew?"Propiedad enviada a revisión.":"Propiedad actualizada.");
    }catch(error){
      for(const path of uploadedPaths){try{await deleteStoragePath(path)}catch{}}
      setUploadProgress("");setMessage(error instanceof Error?error.message:"No fue posible guardar la propiedad.");
    }
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
        <button className={view==="listas"?"is-active":""} onClick={()=>setView("listas")}>Listas compartidas</button>
        <button className={view==="inventario"?"is-active":""} onClick={()=>setView("inventario")}>Mis propiedades</button>
        <button className={view==="red-agentes"?"is-active":""} onClick={()=>setView("red-agentes")}>Propiedades de agentes</button>
        <button className={view==="avaluos"?"is-active":""} onClick={()=>setView("avaluos")}>Avalúos</button>
      </nav>
      <div className="drg-agent-sidebar-foot"><span className={drgWritesEnabled?"is-write":"is-readonly"}>{drgWritesEnabled?"Escritura habilitada":"Modo seguro · solo lectura"}</span><button onClick={()=>void logout()}>Cerrar sesión</button></div>
    </aside>

    <main className="drg-agent-workspace">
      <header className="drg-agent-topbar"><div><p className="drg-kicker">Panel de agente · DRG 2.0</p><h1>{view==="inicio"?"Resumen":view==="perfil"?"Perfil profesional":view==="propiedad"?(editingId?"Editar propiedad":"Nueva propiedad"):view==="listas"?"Listas compartidas":view==="inventario"?"Mis propiedades":view==="red-agentes"?"Propiedades de agentes":"Avalúos"}</h1></div><button onClick={()=>void reload()}>Actualizar datos</button></header>
      {message?<div className="drg-agent-message">{message}<button onClick={()=>setMessage("")}>×</button></div>:null}

      {view==="inicio"?<section className="drg-agent-home">
        <div className="drg-agent-welcome"><div><p className="drg-kicker">Sesión activa</p><h2>Hola, {agent?.name||user?.displayName||"Agente DRG"}</h2></div><div><span>{new Intl.DateTimeFormat("es-NI",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(now)}</span><strong>{new Intl.DateTimeFormat("es-NI",{hour:"numeric",minute:"2-digit",second:"2-digit"}).format(now)}</strong></div></div>
        <div className="drg-private-stats"><article><strong>{stats.total}</strong><span>Mis propiedades</span></article><article><strong>{stats.available}</strong><span>Disponibles</span></article><article><strong>{sharedListCount}</strong><span>Listas compartidas</span></article><article><strong>{profileComplete?"Completo":"Pendiente"}</strong><span>Perfil</span></article></div>
        <div className="drg-agent-home-grid"><article><p className="drg-kicker">Estado de migración</p><h2>Tu panel ya reconoce tu inventario real</h2><p>La arquitectura nueva consulta propiedades asociadas a tu UID y correo, manteniendo compatibilidad con los documentos existentes.</p><button onClick={()=>setView("inventario")}>Revisar inventario</button></article><article><p className="drg-kicker">Seguridad</p><h2>Las mutaciones siguen bloqueadas</h2><p>Perfil, propiedades y Storage están preparados en código, pero no podrán escribir hasta validar reglas y activar explícitamente la bandera de escritura.</p></article></div>
      </section>:null}

      {view==="perfil"?<form className="drg-agent-editor" onSubmit={submitProfile}>
        <fieldset className="drg-agent-editor-section"><legend>Información pública</legend><div className="drg-profile-photo-editor"><div>{pendingProfilePhoto?<img src={URL.createObjectURL(pendingProfilePhoto)} alt="Vista previa"/>:!removeProfilePhoto&&agent?.photo?<img src={agent.photo} alt="Foto de perfil"/>:<span>{(profileDraft.name||"DR").split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}</span>}</div><label>Foto de perfil<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{setPendingProfilePhoto(e.target.files?.[0]||null);if(e.target.files?.[0])setRemoveProfilePhoto(false)}}/><small>JPG, PNG o WEBP · máximo 5 MB</small></label>{pendingProfilePhoto?<button type="button" onClick={()=>setPendingProfilePhoto(null)}>Cancelar selección</button>:agent?.photo&&!removeProfilePhoto?<button type="button" onClick={()=>{setPendingProfilePhoto(null);setRemoveProfilePhoto(true)}}>Quitar foto</button>:removeProfilePhoto?<button type="button" onClick={()=>setRemoveProfilePhoto(false)}>Conservar foto</button>:null}</div><div className="drg-agent-form-grid">
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
          <label>Precio USD<input required type="number" min="1" step="0.01" value={draft.priceUsd||""} onChange={e=>setDraft({...draft,priceUsd:Number(e.target.value)||0})}/><small className="drg-calculated-value">{pricePerArea?"$"+pricePerArea.toLocaleString("en-US",{maximumFractionDigits:2})+" por "+(draft.areaUnit||String(draft.details.areaUnit||"unidad")):"Precio por área se calculará automáticamente"}</small></label>
          <label>Departamento<select value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})}><option value="">Seleccionar</option>{departments.map(d=><option key={d}>{d}</option>)}</select></label>
          <label className="is-wide">Ubicación<input required value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="Ciudad, barrio, referencia"/></label>
          <label>Tipo<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value,details:{}})}>{propertyTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Operación<select value={draft.operation} onChange={e=>setDraft({...draft,operation:e.target.value})}><option value="venta">Venta</option><option value="alquiler">Alquiler</option><option value="venta_renta">Venta / Renta</option></select></label>
          <label>Estado comercial<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="available">Disponible</option><option value="reserved">Reservada</option><option value="sold">Vendida</option><option value="rented">Rentada</option></select></label>
          <label className="is-wide drg-assisted-owner">Agente propietario del listado<select value={listingOwnerId} disabled={Boolean(editingId)} onChange={e=>setListingOwnerId(e.target.value)}><option value="">Seleccionar agente</option>{allAgents.map(item=><option key={item.id} value={item.id}>{item.id===agent?.id||item.email===user?.email?"Mi perfil — ":""}{item.name}{item.email?" · "+item.email:""}</option>)}</select><small>{editingId?"Al editar se conserva el agente propietario actual.":"Puedes enlistarla para tu perfil o ayudar a otro agente habilitado; la carga asistida queda registrada en auditoría privada."}</small></label>
          <label>Visibilidad<select value={draft.visibility} onChange={e=>setDraft({...draft,visibility:e.target.value as AgentPropertyDraft["visibility"]})}><option value="public">Público</option><option value="agents">Solo agentes</option><option value="private">Solo yo</option></select></label>
          <label className="is-wide">Descripción<textarea rows={6} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
          <fieldset className="drg-agent-tags is-wide"><legend>Etiquetas destacadas · máximo 2</legend>{["Nuevo ingreso","Oportunidad","Exclusiva","Negociable","Alta plusvalía"].map(tag=><label key={tag}><input type="checkbox" checked={draft.highlightedTags.includes(tag)} onChange={e=>{const next=e.target.checked?[...draft.highlightedTags,tag]:draft.highlightedTags.filter(item=>item!==tag);if(next.length<=2)setDraft({...draft,highlightedTags:next})}}/>{tag}</label>)}</fieldset>
        </div></fieldset>

        <DynamicFields draft={draft} setDraft={setDraft}/>

        <fieldset className="drg-agent-editor-section"><legend>03 · Ubicación y contrato</legend><div className="drg-agent-form-grid">
          <div className="is-wide"><PropertyLocationPicker lat={draft.lat} lng={draft.lng} locationText={draft.location} onChange={(lat,lng)=>setDraft({...draft,lat,lng})}/></div>
          <label>Latitud<input type="number" step="any" value={draft.lat??""} onChange={e=>setDraft({...draft,lat:n(e.target.value)})}/></label>
          <label>Longitud<input type="number" step="any" value={draft.lng??""} onChange={e=>setDraft({...draft,lng:n(e.target.value)})}/></label>
          <label>Emisión de contrato<input type="date" value={draft.contractStartDate} onChange={e=>setDraft({...draft,contractStartDate:e.target.value})}/></label>
          <label>Vencimiento de contrato<input type="date" value={draft.contractEndDate} onChange={e=>setDraft({...draft,contractEndDate:e.target.value})}/></label>
        </div></fieldset>

        <fieldset className="drg-agent-editor-section"><legend>04 · Multimedia</legend><div className="drg-agent-form-grid">
          <label>Tipo de video<select value={draft.videoType} onChange={e=>setDraft({...draft,videoType:e.target.value as AgentPropertyDraft["videoType"]})}><option value="">Sin video</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select></label>
          <label>URL de video<input type="url" value={draft.videoUrl} onChange={e=>setDraft({...draft,videoUrl:e.target.value})}/></label>
          <div className="is-wide"><PropertyVideoPreview type={draft.videoType} url={draft.videoUrl}/></div>
          <div className="is-wide"><PropertyImageManager images={draft.images} coverImage={draft.coverImage} pendingFiles={pendingImages} pendingCoverKey={pendingCoverKey} writesEnabled={drgWritesEnabled} onImagesChange={images=>setDraft({...draft,images,coverImage:images.includes(draft.coverImage)?draft.coverImage:(images[0]||"")})} onCoverChange={coverImage=>setDraft({...draft,coverImage})} onPendingFilesChange={setPendingImages} onPendingCoverChange={setPendingCoverKey}/></div>
          <label className="is-wide drg-agent-upload-placeholder">Documento legal privado (PDF)<input type="file" accept="application/pdf,.pdf" disabled={!drgWritesEnabled} onChange={e=>{setPendingLegalPdf(e.target.files?.[0]||null);if(e.target.files?.[0])setRemoveExistingLegal(false)}}/><span>{pendingLegalPdf?pendingLegalPdf.name:"PDF privado · máximo 20 MB"}</span></label>
          {editingId&&properties.find(p=>p.id===editingId)?.raw.legalDocument?<div className="is-wide drg-agent-legal-existing"><div><strong>Documento legal existente</strong><span>{String((properties.find(p=>p.id===editingId)?.raw.legalDocument as Record<string,unknown>)?.fileName||"Documento PDF")}</span></div>{(properties.find(p=>p.id===editingId)?.raw.legalDocument as Record<string,unknown>)?.fileUrl?<a href={String((properties.find(p=>p.id===editingId)?.raw.legalDocument as Record<string,unknown>)?.fileUrl)} target="_blank" rel="noreferrer">Abrir PDF</a>:null}<label><input type="checkbox" checked={removeExistingLegal} onChange={e=>{setRemoveExistingLegal(e.target.checked);if(e.target.checked)setPendingLegalPdf(null)}}/>Quitar al guardar</label></div>:null}
        </div></fieldset>

        {uploadProgress?<p className="drg-agent-upload-progress">{uploadProgress}</p>:null}
        <div className="drg-agent-editor-actions"><button type="submit">{drgWritesEnabled?(editingId?"Actualizar propiedad":"Enviar a revisión"):"Guardado bloqueado en Preview"}</button>{editingId?<button type="button" className="is-secondary" onClick={()=>{setEditingId("");setDraft(emptyAgentPropertyDraft())}}>Cancelar edición</button>:null}</div>
      </form>:null}

      {view==="listas"?<AgentSharedLists/>:null}
      {view==="red-agentes"?<AgentBrokerageInventory/>:null}
      {view==="avaluos"?<AvaluosPlaceholder/>:null}

      {view==="inventario"?<section className="drg-agent-inventory">
        <header><div><p>{loading?"Cargando…":properties.length+" propiedades asociadas a tu cuenta"}</p></div><button onClick={newProperty}>Nueva propiedad</button></header>
        <div className="drg-agent-inventory-list">{properties.map(property=><article key={property.id}>
          <div className="drg-agent-inventory-image">{property.coverImage?<img src={property.coverImage} alt=""/>:<span>DRG</span>}</div>
          <div><span className={"drg-agent-publication is-"+String(property.raw.publicationStatus||"approved")}>{publicationLabel(property)}</span><h2>{property.title}</h2><p>{property.location}</p><strong>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Precio no disponible"}</strong><small>{property.typeLabel} · {property.operation==="alquiler"?"Alquiler":"Venta"} · {String(property.raw.visibility||"public")}</small><span className={"drg-contract-chip is-"+getContractStatus(String(property.raw.contractStartDate||""),String(property.raw.contractEndDate||"")).key}>{getContractStatus(String(property.raw.contractStartDate||""),String(property.raw.contractEndDate||"")).label}</span></div>
          <div className="drg-agent-inventory-actions"><button onClick={()=>editProperty(property)}>Editar</button><Link href={"/propiedad/"+property.id} target="_blank">Vista pública</Link><Link href={"/property-sheet/"+property.id} target="_blank">Ficha PDF</Link><button onClick={()=>void markSold(property)}>Marcar vendida</button><button className="is-danger" onClick={()=>void remove(property)}>Eliminar</button></div>
        </article>)}</div>
        {!loading&&!properties.length?<div className="drg-agent-empty">No encontramos propiedades asociadas a esta cuenta.</div>:null}
      </section>:null}
    </main>
  </section>;
}
