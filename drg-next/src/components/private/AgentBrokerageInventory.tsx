"use client";

import { useEffect, useMemo, useState } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { readShareableBrokerageProperties } from "@/lib/firebase/shared-lists";
import type { Property } from "@/types/property";
import { PropertyCard } from "@/components/properties/PropertyCard";

export function AgentBrokerageInventory(){
  const {profile}=useDrgAuth();
  const [properties,setProperties]=useState<Property[]>([]);
  const [search,setSearch]=useState("");const [type,setType]=useState("");const [operation,setOperation]=useState("");const [visibility,setVisibility]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!profile.user)return;setLoading(true);readShareableBrokerageProperties(profile.user,profile.agent).then(setProperties).catch(console.error).finally(()=>setLoading(false))},[profile.user?.uid,profile.agent?.id]);
  const filtered=useMemo(()=>properties.filter(property=>{
    const raw=property.raw;const hay=[property.title,property.location,raw.agentName,raw.department,raw.city].join(" ").toLowerCase();
    const vis=String(raw.visibility||"public");
    return (!search||hay.includes(search.toLowerCase()))&&(!type||property.type===type)&&(!operation||property.operation===operation)&&(!visibility||vis===visibility);
  }),[properties,search,type,operation,visibility]);

  return <section className="drg-brokerage-inventory"><div className="drg-admin-filters"><input placeholder="Título, ubicación o agente" value={search} onChange={e=>setSearch(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option value="">Todos los tipos</option><option value="house">Casa</option><option value="apartment">Apartamento</option><option value="land">Terreno</option><option value="farm">Finca</option><option value="commercial">Comercial</option></select><select value={operation} onChange={e=>setOperation(e.target.value)}><option value="">Venta y alquiler</option><option value="venta">Venta</option><option value="alquiler">Alquiler</option></select><select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="">Público y agentes</option><option value="public">Público</option><option value="agents">Solo agentes</option></select></div>
    <p className="drg-brokerage-count">{loading?"Cargando propiedades…":filtered.length+" propiedades disponibles para la red de agentes"}</p>
    <div className="drg-properties-grid drg-brokerage-property-grid">
      {filtered.map(property=><PropertyCard key={property.id} property={property}/>)}
    </div>
    {!loading&&!filtered.length?<div className="drg-agent-empty">No hay propiedades que coincidan con los filtros.</div>:null}
  </section>;
}
