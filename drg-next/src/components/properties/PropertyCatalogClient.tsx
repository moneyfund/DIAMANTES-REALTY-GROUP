"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { readProperties } from "@/lib/firebase/properties";
import { getPublishingAgentId } from "@/lib/properties/detail";
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property } from "@/types/property";

type SortMode = "recent" | "price-asc" | "price-desc" | "featured";

function normalizeSearch(value: unknown) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function timestamp(property: Property) {
  const value = property.raw.createdAt || property.raw.updatedAt;
  if (value && typeof value === "object" && "seconds" in value && typeof (value as { seconds?: unknown }).seconds === "number") {
    return (value as { seconds: number }).seconds;
  }
  return typeof value === "number" ? value : 0;
}

function featured(property: Property) {
  const values = [property.raw.highlightedTags, property.raw.highlightTags, property.raw.tags].flat().filter(Boolean).map(String).map((item) => item.toLowerCase());
  return property.raw.featured === true || property.raw.destacado === true || values.includes("exclusiva") || values.includes("oportunidad");
}

const TYPE_ALIASES: Record<string,string[]> = {
  house:["casa","casas","vivienda","hogar"],
  apartment:["apartamento","apartamentos","apto","condominio"],
  land:["terreno","terrenos","lote","lotes"],
  farm:["finca","fincas","hacienda"],
  quinta:["quinta","quintas"],
  warehouse:["bodega","bodegas","almacen","almacenes"],
  office:["oficina","oficinas"],
  commercial:["comercial","local","locales","negocio"],
  investment:["inversion","inversionista","proyecto"],
  beach_house:["playa","casa de playa","mar"]
};

function inferSmartFilters(value:string){
  const query=normalizeSearch(value);
  let operation="";
  if(/\b(alquiler|alquilar|renta|rentar)\b/.test(query))operation="alquiler";
  else if(/\b(venta|comprar|compra|vendo)\b/.test(query))operation="venta";

  let type="";
  for(const [key,aliases] of Object.entries(TYPE_ALIASES)){
    if(aliases.some(alias=>query.includes(alias))){type=key;break}
  }

  const budgetMatch=query.match(/(?:hasta|maximo|max|menos de)?\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|millon|millones)?/);
  let maxBudget=0;
  if(budgetMatch){
    const base=Number(String(budgetMatch[1]).replace(",","."));
    const unit=budgetMatch[2]||"";
    if(Number.isFinite(base)){
      maxBudget=unit==="k"||unit==="mil"?base*1000:unit.startsWith("millon")?base*1000000:base>=5000?base:0;
    }
  }

  const bedMatch=query.match(/(\d+)\s*(habitacion|habitaciones|cuarto|cuartos|dormitorio|dormitorios)/);
  const bathMatch=query.match(/(\d+)\s*(bano|banos)/);

  return {
    query,
    operation,
    type,
    maxBudget,
    minBedrooms:bedMatch?Number(bedMatch[1]):0,
    minBathrooms:bathMatch?Number(bathMatch[1]):0
  };
}

function searchableText(property:Property){
  const raw=property.raw;
  const values=[
    property.title,
    property.description,
    property.location,
    property.type,
    property.typeLabel,
    property.operation,
    raw.department,raw.departamento,raw.city,raw.address,raw.direccion,raw.ubicacion,
    raw.neighborhood,raw.barrio,raw.zone,raw.zona,
    raw.highlightedTags,raw.highlightTags,raw.tags,
    raw.topography,raw.topografia,raw.access,raw.acceso,raw.streetType,
    raw.currentUse,raw.potentialUse,raw.idealFor,raw.amenities
  ].flat().filter(Boolean);
  return normalizeSearch(values.join(" "));
}

export function PropertyCatalogClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [operation, setOperation] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [agentId, setAgentId] = useState("");
  const [filtersOpen,setFiltersOpen]=useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialLocation=params.get("ubicacion") || "";
    const initialType=params.get("tipo") || "";
    const initialOperation=params.get("operacion") || params.get("tipoOperacion") || "";
    setLocation(initialLocation);
    setType(initialType);
    setOperation(initialOperation);
    setAgentId(params.get("agent") || "");
    const initialParts=[
      initialType?Object.entries(TYPE_ALIASES).find(([key])=>key===initialType)?.[1]?.[0]:"",
      initialLocation,
      initialOperation==="alquiler"?"alquiler":initialOperation==="venta"?"venta":""
    ].filter(Boolean);
    setSearch(initialParts.join(" "));

    readProperties(200)
      .then((result) => setProperties(result.properties))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const smart=inferSmartFilters(search);
    const locationNeedle = normalizeSearch(location);
    const maxBudget = Number(budget || 0) || smart.maxBudget;
    const minBedrooms = Number(bedrooms || 0) || smart.minBedrooms;
    const minBathrooms = Number(bathrooms || 0) || smart.minBathrooms;
    const effectiveType=type||smart.type;
    const effectiveOperation=operation||smart.operation;

    const ignoredTokens=new Set([
      "casa","casas","vivienda","hogar","apartamento","apartamentos","apto","condominio","terreno","terrenos","lote","lotes",
      "finca","fincas","hacienda","quinta","quintas","bodega","bodegas","almacen","almacenes","oficina","oficinas","comercial",
      "local","locales","negocio","inversion","inversionista","proyecto","playa","mar","venta","comprar","compra","vendo",
      "alquiler","alquilar","renta","rentar","hasta","maximo","max","menos","de","habitacion","habitaciones","cuarto","cuartos",
      "dormitorio","dormitorios","bano","banos","en","con","y","para"
    ]);
    const freeTokens=smart.query
      .split(/\s+/)
      .map(token=>token.replace(/[^a-z0-9]/g,""))
      .filter(token=>token.length>1&&!ignoredTokens.has(token)&&!/^\d+$/.test(token));

    const result = properties.filter((property) => {
      const raw = property.raw;
      const corpus=searchableText(property);
      const locationValues = [property.location, raw.department, raw.departamento, raw.city, raw.address, raw.direccion, raw.ubicacion];
      const matchesLocation = !locationNeedle || locationValues.some((value) => normalizeSearch(value).includes(locationNeedle));
      const matchesType = !effectiveType || property.type === effectiveType;
      const matchesOperation = !effectiveOperation || property.operation === effectiveOperation || property.operation === "venta_renta";
      const matchesBudget = !maxBudget || Boolean(property.priceUsd && property.priceUsd <= maxBudget);
      const matchesBedrooms = !minBedrooms || Boolean(property.bedrooms && property.bedrooms >= minBedrooms);
      const matchesBathrooms = !minBathrooms || Boolean(property.bathrooms && property.bathrooms >= minBathrooms);
      const matchesAgent = !agentId || getPublishingAgentId(property) === agentId;
      const matchesSmartText=!freeTokens.length||freeTokens.every(token=>corpus.includes(token));
      return matchesLocation && matchesType && matchesOperation && matchesBudget && matchesBedrooms && matchesBathrooms && matchesAgent && matchesSmartText;
    });

    result.sort((a, b) => {
      if (sort === "price-asc") return (a.priceUsd || Number.MAX_SAFE_INTEGER) - (b.priceUsd || Number.MAX_SAFE_INTEGER);
      if (sort === "price-desc") return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sort === "featured") return Number(featured(b)) - Number(featured(a)) || timestamp(b) - timestamp(a);
      return timestamp(b) - timestamp(a);
    });

    return result;
  }, [properties, search, location, type, operation, budget, bedrooms, bathrooms, sort, agentId]);

  const advancedCount=[location,type,operation,budget,bedrooms,bathrooms,agentId].filter(Boolean).length;

  function clearFilters() {
    setSearch("");setLocation(""); setType(""); setOperation(""); setBudget(""); setBedrooms(""); setBathrooms(""); setAgentId("");
  }

  return (
    <section className="drg-catalog drg-catalog-minimal">
      <div className="drg-smart-search-shell">
        <div className="drg-smart-search">
          <Search aria-hidden="true" />
          <input
            value={search}
            onChange={(event)=>setSearch(event.target.value)}
            placeholder="Busca: casa en Matagalpa, finca, alquiler, 3 habitaciones, hasta $100 mil…"
            aria-label="Buscar propiedades"
          />
          {search?<button className="drg-smart-clear" type="button" onClick={()=>setSearch("")} aria-label="Limpiar búsqueda"><X size={16}/></button>:null}
          <button className={"drg-smart-filter-toggle"+(filtersOpen?" is-open":"")} type="button" onClick={()=>setFiltersOpen(value=>!value)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={17}/>
            <span>Filtros</span>
            {advancedCount?<b>{advancedCount}</b>:null}
          </button>
        </div>
        <div className="drg-smart-meta">
          <p>{loading?"Cargando propiedades…":String(filtered.length)+" propiedades"}</p>
          <Link href="/mapa">Ver en mapa ↗</Link>
        </div>
      </div>

      {filtersOpen?<div className="drg-smart-filters">
        <label><span>Operación</span><select value={operation} onChange={(event)=>setOperation(event.target.value)}><option value="">Todas</option><option value="venta">Comprar</option><option value="alquiler">Alquilar</option></select></label>
        <label><span>Tipo</span><select value={type} onChange={(event)=>setType(event.target.value)}><option value="">Todos</option><option value="house">Casa</option><option value="apartment">Apartamento</option><option value="land">Terreno</option><option value="farm">Finca</option><option value="quinta">Quinta</option><option value="warehouse">Bodega</option><option value="office">Oficina</option><option value="commercial">Comercial</option><option value="investment">Inversión</option><option value="beach_house">Casa cerca del mar</option></select></label>
        <label><span>Ubicación</span><input value={location} onChange={(event)=>setLocation(event.target.value)} placeholder="Ciudad o zona"/></label>
        <label><span>Presupuesto</span><select value={budget} onChange={(event)=>setBudget(event.target.value)}><option value="">Sin límite</option><option value="50000">Hasta $50K</option><option value="100000">Hasta $100K</option><option value="150000">Hasta $150K</option><option value="300000">Hasta $300K</option><option value="500000">Hasta $500K</option><option value="1000000">Hasta $1M</option></select></label>
        <label><span>Habitaciones</span><select value={bedrooms} onChange={(event)=>setBedrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>
        <label><span>Baños</span><select value={bathrooms} onChange={(event)=>setBathrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event)=>setSort(event.target.value as SortMode)}><option value="recent">Más recientes</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="featured">Destacadas</option></select></label>
        <button type="button" className="drg-smart-reset" onClick={clearFilters}>Limpiar todo</button>
      </div>:null}

      {!loading && filtered.length === 0 ? (
        <div className="drg-empty"><h2>No encontramos propiedades con esa búsqueda.</h2><p>Prueba otra zona, tipo de propiedad o presupuesto.</p><button type="button" onClick={clearFilters}>Limpiar búsqueda</button></div>
      ) : (
        <div className="drg-properties-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
      )}
    </section>
  );
}
