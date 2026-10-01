"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgWritesEnabled } from "@/lib/config/writes";
import { createSharedPropertyList, deleteSharedList, readOwnSharedLists, readShareableBrokerageProperties, setSharedListStatus, type SharedPropertyList } from "@/lib/firebase/shared-lists";
import type { Property } from "@/types/property";

function dateText(value:unknown){
  if(!value||typeof value!=="object"||!("seconds" in value))return"Fecha pendiente";
  const seconds=Number((value as {seconds?:unknown}).seconds||0);
  return seconds?new Intl.DateTimeFormat("es-NI",{dateStyle:"medium",timeStyle:"short"}).format(new Date(seconds*1000)):"Fecha pendiente";
}
function shareUrl(token:string){return typeof window==="undefined"?"/share?token="+encodeURIComponent(token):window.location.origin+"/share?token="+encodeURIComponent(token)}

export function AgentSharedLists(){
  const {profile}=useDrgAuth();
  const [inventory,setInventory]=useState<Property[]>([]);
  const [lists,setLists]=useState<SharedPropertyList[]>([]);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [title,setTitle]=useState(""); const [clientName,setClientName]=useState(""); const [notes,setNotes]=useState("");
  const [search,setSearch]=useState(""); const [operation,setOperation]=useState(""); const [type,setType]=useState(""); const [department,setDepartment]=useState(""); const [price,setPrice]=useState("");
  const [message,setMessage]=useState(""); const [loading,setLoading]=useState(true);
  const user=profile.user;

  async function reload(){
    if(!user)return;
    setLoading(true);
    try{
      const [items,ownLists]=await Promise.all([readShareableBrokerageProperties(user,profile.agent),readOwnSharedLists(user)]);
      setInventory(items);setLists(ownLists);
    }catch(error){console.error(error);setMessage("No fue posible cargar listas e inventario compartible.");}
    finally{setLoading(false)}
  }
  useEffect(()=>{void reload()},[user?.uid,profile.agent?.id]);

  const filtered=useMemo(()=>inventory.filter(property=>{
    const raw=property.raw;
    const hay=[property.title,property.location,raw.city,raw.department,raw.agentName].join(" ").toLowerCase();
    const amount=property.priceUsd||0;
    let priceOk=true;
    if(price){
      const [min,max]=price.split("-"); const lo=Number(min||0),hi=max?Number(max):Infinity;
      priceOk=amount>=lo&&amount<=hi;
    }
    return (!search||hay.includes(search.toLowerCase()))&&(!operation||property.operation===operation)&&(!type||property.type===type)&&
      (!department||String(raw.department||raw.city||"").toLowerCase()===department)&&priceOk;
  }),[inventory,search,operation,type,department,price]);

  function toggle(id:string){setSelected(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next})}

  async function submit(event:FormEvent){
    event.preventDefault();
    if(!user)return;
    if(!drgWritesEnabled){setMessage("La creación de listas sigue bloqueada en esta Preview.");return}
    try{
      const result=await createSharedPropertyList({user,agent:profile.agent,title,clientName,notes,propertyIds:[...selected]});
      setTitle("");setClientName("");setNotes("");setSelected(new Set());await reload();
      const url=shareUrl(result.token);
      try{await navigator.clipboard.writeText(url);setMessage("Lista creada y enlace copiado.");}catch{setMessage("Lista creada: "+url)}
    }catch(error){setMessage(error instanceof Error?error.message:"No fue posible crear la lista.")}
  }
  async function toggleStatus(item:SharedPropertyList){
    if(!user)return;
    if(!drgWritesEnabled){setMessage("Cambio de estado bloqueado en Preview.");return}
    try{await setSharedListStatus(item.id,item.status==="active"?"inactive":"active",user);await reload();}catch(error){setMessage(error instanceof Error?error.message:"No fue posible actualizar la lista.")}
  }
  async function remove(item:SharedPropertyList){
    if(!user)return;
    if(!drgWritesEnabled){setMessage("Eliminación bloqueada en Preview.");return}
    if(!window.confirm("¿Eliminar esta lista compartida?"))return;
    try{await deleteSharedList(item.id,user);await reload();}catch(error){setMessage(error instanceof Error?error.message:"No fue posible eliminarla.")}
  }

  return <section className="drg-agent-shared">
    {message?<div className="drg-agent-message">{message}<button onClick={()=>setMessage("")}>×</button></div>:null}
    <form className="drg-agent-editor drg-shared-create" onSubmit={submit}>
      <fieldset className="drg-agent-editor-section"><legend>Crear selección para cliente</legend><div className="drg-agent-form-grid">
        <label>Título de la lista<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Opciones para familia Martínez"/></label>
        <label>Cliente<input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Nombre opcional"/></label>
        <label className="is-wide">Notas internas<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      </div><div className="drg-shared-create-actions"><span>{selected.size} propiedades seleccionadas</span><button type="submit">{drgWritesEnabled?"Crear lista compartida":"Creación bloqueada"}</button></div></fieldset>
    </form>

    <section className="drg-shared-inventory"><header><div><p className="drg-kicker">Inventario de la correduría</p><h2>Disponibles para compartir</h2><p>{loading?"Cargando…":filtered.length+" resultados"}</p></div></header>
      <div className="drg-shared-filters"><input placeholder="Título, ubicación, agente…" value={search} onChange={e=>setSearch(e.target.value)}/><select value={operation} onChange={e=>setOperation(e.target.value)}><option value="">Venta y alquiler</option><option value="venta">Venta</option><option value="alquiler">Alquiler</option><option value="venta_renta">Venta/Renta</option></select><select value={type} onChange={e=>setType(e.target.value)}><option value="">Todos los tipos</option><option value="house">Casa</option><option value="apartment">Apartamento</option><option value="land">Terreno</option><option value="farm">Finca</option><option value="quinta">Quinta</option><option value="commercial">Comercial</option><option value="warehouse">Bodega</option><option value="office">Oficina</option></select><select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">Todos los departamentos</option>{["matagalpa","estelí","managua","león","granada","jinotega","nueva segovia","rivas","chinandega"].map(v=><option key={v} value={v}>{v}</option>)}</select><select value={price} onChange={e=>setPrice(e.target.value)}><option value="">Todos los precios</option><option value="0-50000">Hasta $50,000</option><option value="50000-100000">$50k–$100k</option><option value="100000-200000">$100k–$200k</option><option value="200000-500000">$200k–$500k</option><option value="500000-">Más de $500k</option></select></div>
      <div className="drg-shared-grid">{filtered.map(property=><button type="button" key={property.id} className={selected.has(property.id)?"is-selected":""} onClick={()=>toggle(property.id)}><div>{property.coverImage?<img src={property.coverImage} alt=""/>:<span>DRG</span>}<i>{selected.has(property.id)?"✓":"+"}</i></div><span><strong>{property.title}</strong><small>{property.location}</small><b>{property.priceUsd?"$"+property.priceUsd.toLocaleString("en-US")+" USD":"Consultar"}</b><em>{String(property.raw.agentName||"Agente DRG")}</em></span></button>)}</div>
    </section>

    <section className="drg-shared-history"><header><p className="drg-kicker">Historial</p><h2>Mis listas creadas</h2></header><div>{lists.map(item=><article key={item.id}><div><span className={item.status==="active"?"is-active":"is-inactive"}>{item.status==="active"?"Activa":"Inactiva"}</span><h3>{item.title}</h3><p>{dateText(item.createdAt)} · {item.propertyIds.length} propiedades{item.clientName?" · "+item.clientName:""}</p><small>{shareUrl(item.token)}</small></div><div><button onClick={async()=>{const url=shareUrl(item.token);try{await navigator.clipboard.writeText(url);setMessage("Enlace copiado.")}catch{setMessage(url)}}}>Copiar link</button><button onClick={()=>void toggleStatus(item)}>{item.status==="active"?"Desactivar":"Activar"}</button><button className="is-danger" onClick={()=>void remove(item)}>Eliminar</button></div></article>)}</div>{!lists.length?<p className="drg-agent-empty">Todavía no has creado listas compartidas.</p>:null}</section>
  </section>;
}
