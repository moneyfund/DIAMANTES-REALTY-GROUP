"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { setPropertyLegalDocumentAsAdmin, updatePropertyAsAdmin } from "@/lib/firebase/admin-data";
import { getDynamicFieldsForType } from "@/lib/properties/fields";
import { propertyToDraft, validateContractDates, type AgentPropertyDraft } from "@/lib/properties/private";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { PropertyLocationPicker } from "@/components/properties/PropertyLocationPicker";
import { PropertyImageManager, propertyImageFileKey } from "@/components/properties/PropertyImageManager";
import { deleteStoragePath, deleteStorageUrlIfOwned, uploadAdminPropertyImage, uploadLegalPdf } from "@/lib/firebase/private-storage";
import { PropertyVideoPreview } from "@/components/properties/PropertyVideoPreview";
import { validatePropertyVideo } from "@/lib/properties/video";
import { PropertyFormStepper } from "@/components/properties/PropertyFormStepper";

const propertyTypes=[["house","Casa"],["apartment","Apartamento"],["land","Terreno"],["farm","Finca"],["quinta","Quinta"],["warehouse","Bodega"],["commercial","Comercial"],["office","Oficina"],["investment","Inversión"],["other","Otro"]] as const;
const departments=["Boaco","Carazo","Chinandega","Chontales","Estelí","Granada","Jinotega","León","Madriz","Managua","Masaya","Matagalpa","Nueva Segovia","Rivas","Río San Juan"];
function num(value:string){const n=Number(value);return Number.isFinite(n)&&value!==""?n:null}

export function AdminPropertyEditor({property,agents,onClose,onSaved}:{property:Property;agents:Agent[];onClose:()=>void;onSaved:()=>Promise<void>}){
  const {profile}=useDrgAuth();
  const [draft,setDraft]=useState<AgentPropertyDraft>(()=>propertyToDraft(property));
  const [agentId,setAgentId]=useState("");
  const [message,setMessage]=useState("");
  const [pendingImages,setPendingImages]=useState<File[]>([]);
  const [pendingCoverKey,setPendingCoverKey]=useState("");
  const [uploading,setUploading]=useState("");
  const [pendingLegalPdf,setPendingLegalPdf]=useState<File|null>(null);
  const [removeLegal,setRemoveLegal]=useState(false);
  const [step,setStep]=useState(1);
  const fields=useMemo(()=>getDynamicFieldsForType(draft.type),[draft.type]);

  useEffect(()=>{
    const raw=property.raw;
    const identifiers=[raw.agentId,raw.agenteId,raw.ownerId,raw.userId,raw.createdBy].map(v=>String(v||""));
    const emails=[raw.agentEmail,raw.ownerEmail,raw.createdByEmail,raw.email].map(v=>String(v||"").toLowerCase());
    const found=agents.find(agent=>{
      const ids=[agent.id,agent.raw.uid,agent.raw.userId,agent.raw.agentId].map(v=>String(v||""));
      return ids.some(id=>id&&identifiers.includes(id))||Boolean(agent.email&&emails.includes(agent.email.toLowerCase()));
    });
    setAgentId(found?.id||"");
  },[property,agents]);

  function goToStep(next:number){if(next>=1&&next<step){setStep(next);setMessage("")}}
  function previousStep(){setMessage("");setStep(value=>Math.max(1,value-1))}
  function nextStep(){
    if(step===1){
      if(!draft.title.trim()||!draft.location.trim()||draft.priceUsd<=0){setMessage("Completa título, ubicación y precio antes de continuar.");return}
      if(!agentId){setMessage("Selecciona el agente responsable antes de continuar.");return}
    }
    if(step===3){
      const contract=validateContractDates(draft.contractStartDate,draft.contractEndDate);
      if(!contract.valid){setMessage(contract.message);return}
    }
    setMessage("");setStep(value=>Math.min(4,value+1));
  }

  async function submit(event:FormEvent){
    event.preventDefault();
    if(!profile.user)return;
    const assigned=agents.find(agent=>agent.id===agentId);
    if(!assigned){setMessage("Selecciona el agente responsable.");return}
    const contract=validateContractDates(draft.contractStartDate,draft.contractEndDate);
    if(!contract.valid){setMessage(contract.message);return}
    const videoValidation=validatePropertyVideo(draft.videoType,draft.videoUrl);
    if(!videoValidation.valid){setMessage(videoValidation.message);return}
    if(!draft.title.trim()||!draft.location.trim()||draft.priceUsd<=0){setMessage("Título, ubicación y precio son obligatorios.");return}
    if(!drgWritesEnabled){setMessage("La edición administrativa está lista, pero las escrituras siguen bloqueadas en esta Preview.");return}
    const uploadedPaths:string[]=[];
    try{
      const uploadedUrls:string[]=[];
      for(let index=0;index<pendingImages.length;index+=1){
        setUploading(`Subiendo imagen ${index+1} de ${pendingImages.length}…`);
        const uploaded=await uploadAdminPropertyImage(pendingImages[index],property.id);uploadedUrls.push(uploaded.url);uploadedPaths.push(uploaded.path);
      }
      const images=[...draft.images,...uploadedUrls];
      const pendingIndex=pendingCoverKey?pendingImages.findIndex(file=>propertyImageFileKey(file)===pendingCoverKey):-1;
      const nextDraft={...draft,images,coverImage:pendingIndex>=0?uploadedUrls[pendingIndex]:(draft.coverImage&&images.includes(draft.coverImage)?draft.coverImage:(images[0]||""))};
      setUploading("Guardando propiedad…");
      const removedOwnedImages=property.images.filter(url=>!nextDraft.images.includes(url));
      await updatePropertyAsAdmin({propertyId:property.id,draft:nextDraft,assignedAgent:assigned,adminUser:profile.user});
      const existingLegal=property.raw.legalDocument&&typeof property.raw.legalDocument==="object" ? property.raw.legalDocument as Record<string,unknown> : null;
      const oldLegalPath=String(existingLegal?.storagePath||"");
      if(pendingLegalPdf){
        setUploading("Subiendo documento legal…");
        const legal=await uploadLegalPdf(pendingLegalPdf,property.id);
        uploadedPaths.push(legal.path);
        await setPropertyLegalDocumentAsAdmin(property.id,{fileName:pendingLegalPdf.name,fileUrl:legal.url,storagePath:legal.path});
        if(oldLegalPath&&oldLegalPath!==legal.path){try{await deleteStoragePath(oldLegalPath)}catch{}}
      }else if(removeLegal&&existingLegal){
        await setPropertyLegalDocumentAsAdmin(property.id,null);
        if(oldLegalPath){try{await deleteStoragePath(oldLegalPath)}catch{}}
      }
      for(const url of removedOwnedImages){try{await deleteStorageUrlIfOwned(url)}catch(error){console.warn("[DRG admin image cleanup]",url,error)}}
      setPendingImages([]);setPendingCoverKey("");setPendingLegalPdf(null);setRemoveLegal(false);setUploading("");await onSaved();setMessage("Propiedad actualizada.");
    }catch(error){
      for(const path of uploadedPaths){try{await deleteStoragePath(path)}catch{}}
      setUploading("");setMessage(error instanceof Error?error.message:"No fue posible actualizar la propiedad.");
    }
  }

  return <div className="drg-admin-modal drg-admin-property-editor-modal" role="dialog" aria-modal="true"><form className="drg-admin-property-editor" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}>
    <header><div><p className="drg-kicker">Editor administrativo</p><h2>{property.title}</h2><p>Actualiza inventario sin perder trazabilidad ni ownership.</p></div><button type="button" onClick={onClose}>×</button></header>
    {message?<div className="drg-agent-message">{message}</div>:null}
    <PropertyFormStepper step={step} onStepChange={goToStep}/>
    {step===1?<fieldset><legend>01 · Información general</legend><div className="drg-agent-form-grid">
      <label className="is-wide">Título<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
      <label>Precio USD<input type="number" min="1" step=".01" value={draft.priceUsd||""} onChange={e=>setDraft({...draft,priceUsd:Number(e.target.value)||0})}/></label>
      <label>Agente responsable<select value={agentId} onChange={e=>setAgentId(e.target.value)}><option value="">Seleccionar agente</option>{agents.map(agent=><option key={agent.id} value={agent.id}>{agent.name} · {agent.email}</option>)}</select></label>
      <label>Departamento<select value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})}><option value="">Seleccionar</option>{departments.map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Ubicación<input value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/></label>
      <label>Tipo<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value,details:{}})}>{propertyTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>Operación<select value={draft.operation} onChange={e=>setDraft({...draft,operation:e.target.value})}><option value="venta">Venta</option><option value="alquiler">Alquiler</option><option value="venta_renta">Venta/Renta</option></select></label>
      <label>Estado comercial<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="available">Disponible</option><option value="reserved">Reservada</option><option value="sold">Vendida</option><option value="rented">Rentada</option></select></label>
      <label>Visibilidad<select value={draft.visibility} onChange={e=>setDraft({...draft,visibility:e.target.value as AgentPropertyDraft["visibility"]})}><option value="public">Público</option><option value="agents">Solo agentes</option><option value="private">Solo propietario</option></select></label>
      <label className="is-wide">Descripción<textarea rows={5} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
      <fieldset className="drg-agent-tags is-wide"><legend>Etiquetas destacadas · máximo 2</legend>{["Nuevo ingreso","Oportunidad","Exclusiva","Negociable","Alta plusvalía"].map(tag=><label key={tag}><input type="checkbox" checked={draft.highlightedTags.includes(tag)} onChange={e=>{const next=e.target.checked?[...draft.highlightedTags,tag]:draft.highlightedTags.filter(v=>v!==tag);if(next.length<=2)setDraft({...draft,highlightedTags:next})}}/>{tag}</label>)}</fieldset>
    </div></fieldset>:null}
    {step===2&&fields.length?<fieldset><legend>02 · Características específicas</legend><div className="drg-agent-form-grid">{fields.map(([key,input,label,options])=>{
      const value=draft.details[key]??"";
      const set=(v:string)=>setDraft({...draft,details:{...draft.details,[key]:input==="number"?(num(v)??""):v}});
      return input==="select"?<label key={key}>{label}<select value={String(value)} onChange={e=>set(e.target.value)}><option value="">Seleccionar</option>{options?.map(option=><option key={option}>{option}</option>)}</select></label>:input==="textarea"?<label key={key} className="is-wide">{label}<textarea rows={3} value={String(value)} onChange={e=>set(e.target.value)}/></label>:<label key={key}>{label}<input type={input} value={String(value)} onChange={e=>set(e.target.value)}/></label>
    })}</div></fieldset>:null}
    {step===3?<fieldset><legend>03 · Ubicación y contrato</legend><div className="drg-agent-form-grid">
      <div className="is-wide"><PropertyLocationPicker lat={draft.lat} lng={draft.lng} locationText={draft.location} onChange={(lat,lng)=>setDraft({...draft,lat,lng})}/></div>
      <label>Latitud<input type="number" step="any" value={draft.lat??""} onChange={e=>setDraft({...draft,lat:num(e.target.value)})}/></label><label>Longitud<input type="number" step="any" value={draft.lng??""} onChange={e=>setDraft({...draft,lng:num(e.target.value)})}/></label>
      <label>Emisión contrato<input type="date" value={draft.contractStartDate} onChange={e=>setDraft({...draft,contractStartDate:e.target.value})}/></label><label>Vencimiento contrato<input type="date" value={draft.contractEndDate} onChange={e=>setDraft({...draft,contractEndDate:e.target.value})}/></label>
    </div></fieldset>:null}
    {step===4?<fieldset><legend>04 · Multimedia y revisión</legend><div className="drg-agent-form-grid">
      <label>Video<select value={draft.videoType} onChange={e=>setDraft({...draft,videoType:e.target.value as AgentPropertyDraft["videoType"]})}><option value="">Sin video</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select></label><label>URL video<input value={draft.videoUrl} onChange={e=>setDraft({...draft,videoUrl:e.target.value})}/></label>
      <div className="is-wide"><PropertyVideoPreview type={draft.videoType} url={draft.videoUrl}/></div>
      <div className="is-wide"><PropertyImageManager images={draft.images} coverImage={draft.coverImage} pendingFiles={pendingImages} pendingCoverKey={pendingCoverKey} writesEnabled={drgWritesEnabled} onImagesChange={images=>setDraft({...draft,images,coverImage:images.includes(draft.coverImage)?draft.coverImage:(images[0]||"")})} onCoverChange={coverImage=>setDraft({...draft,coverImage})} onPendingFilesChange={setPendingImages} onPendingCoverChange={setPendingCoverKey}/></div>
      <label className="is-wide drg-agent-upload-placeholder">Reemplazar / cargar documento legal (PDF)<input type="file" accept="application/pdf,.pdf" disabled={!drgWritesEnabled} onChange={e=>{setPendingLegalPdf(e.target.files?.[0]||null);if(e.target.files?.[0])setRemoveLegal(false)}}/><span>{pendingLegalPdf?pendingLegalPdf.name:"PDF privado · máximo 20 MB"}</span></label>
      {property.raw.legalDocument&&typeof property.raw.legalDocument==="object"?<div className="is-wide drg-agent-legal-existing"><div><strong>Documento legal privado actual</strong><span>{String((property.raw.legalDocument as Record<string,unknown>).fileName||"PDF registrado")}</span></div>{(property.raw.legalDocument as Record<string,unknown>).fileUrl?<a href={String((property.raw.legalDocument as Record<string,unknown>).fileUrl)} target="_blank" rel="noreferrer">Abrir PDF</a>:null}<label><input type="checkbox" checked={removeLegal} onChange={e=>{setRemoveLegal(e.target.checked);if(e.target.checked)setPendingLegalPdf(null)}}/>Quitar al guardar</label></div>:null}
    </div></fieldset>:null}
    {uploading?<p className="drg-agent-upload-progress">{uploading}</p>:null}<footer>
      <button type="button" onClick={onClose}>Cancelar</button>
      {step>1?<button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();previousStep()}}>← Anterior</button>:null}
      {step<4?<button type="button" className="is-primary" onClick={e=>{e.preventDefault();e.stopPropagation();nextStep()}}>Continuar →</button>:<button type="submit">{drgWritesEnabled?"Guardar cambios":"Guardado bloqueado en Preview"}</button>}
    </footer>
  </form></div>;
}
