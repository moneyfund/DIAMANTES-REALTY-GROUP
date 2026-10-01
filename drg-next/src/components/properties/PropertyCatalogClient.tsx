"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

export function PropertyCatalogClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [operation, setOperation] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocation(params.get("ubicacion") || "");
    setType(params.get("tipo") || "");
    setOperation(params.get("operacion") || params.get("tipoOperacion") || "");
    setAgentId(params.get("agent") || "");

    readProperties(200)
      .then((result) => setProperties(result.properties))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const locationNeedle = normalizeSearch(location);
    const maxBudget = Number(budget || 0);
    const minBedrooms = Number(bedrooms || 0);
    const minBathrooms = Number(bathrooms || 0);

    const result = properties.filter((property) => {
      const raw = property.raw;
      const locationValues = [property.location, raw.department, raw.departamento, raw.city, raw.address, raw.direccion, raw.ubicacion];
      const matchesLocation = !locationNeedle || locationValues.some((value) => normalizeSearch(value).includes(locationNeedle));
      const matchesType = !type || property.type === type;
      const matchesOperation = !operation || property.operation === operation || property.operation === "venta_renta";
      const matchesBudget = !maxBudget || Boolean(property.priceUsd && property.priceUsd <= maxBudget);
      const matchesBedrooms = !minBedrooms || Boolean(property.bedrooms && property.bedrooms >= minBedrooms);
      const matchesBathrooms = !minBathrooms || Boolean(property.bathrooms && property.bathrooms >= minBathrooms);
      const matchesAgent = !agentId || getPublishingAgentId(property) === agentId;
      return matchesLocation && matchesType && matchesOperation && matchesBudget && matchesBedrooms && matchesBathrooms && matchesAgent;
    });

    result.sort((a, b) => {
      if (sort === "price-asc") return (a.priceUsd || Number.MAX_SAFE_INTEGER) - (b.priceUsd || Number.MAX_SAFE_INTEGER);
      if (sort === "price-desc") return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sort === "featured") return Number(featured(b)) - Number(featured(a)) || timestamp(b) - timestamp(a);
      return timestamp(b) - timestamp(a);
    });

    return result;
  }, [properties, location, type, operation, budget, bedrooms, bathrooms, sort, agentId]);

  function clearFilters() {
    setLocation(""); setType(""); setOperation(""); setBudget(""); setBedrooms(""); setBathrooms(""); setAgentId("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <section className="drg-catalog">
      <header className="drg-catalog-header">
        <div>
          <p className="drg-kicker">Encuentra tu próximo capítulo</p>
          <h1>Espacios con posibilidades.</h1>
          <p>Propiedades para vivir, invertir y crecer en Nicaragua.</p>
        </div>
        <Link className="drg-map-link" href="/mapa">Explorar el mapa ↗</Link>
      </header>

      <div className="drg-catalog-tabs" role="group" aria-label="Tipo de operación">
        <button type="button" aria-pressed={!operation} className={!operation ? "is-active" : ""} onClick={() => setOperation("")}>Todas</button>
        <button type="button" aria-pressed={operation === "venta"} className={operation === "venta" ? "is-active" : ""} onClick={() => setOperation("venta")}>Comprar</button>
        <button type="button" aria-pressed={operation === "alquiler"} className={operation === "alquiler" ? "is-active" : ""} onClick={() => setOperation("alquiler")}>Alquilar</button>
      </div>

      <form className="drg-catalog-filters" onSubmit={submit}>
        <label className="drg-location-search"><span>Ubicación</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Busca ciudad, barrio, zona o dirección" /></label>
        <label><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos los tipos</option><option value="house">Casas</option><option value="apartment">Apartamentos</option><option value="land">Terrenos</option><option value="farm">Fincas</option><option value="quinta">Quintas</option><option value="warehouse">Bodegas</option><option value="office">Oficinas</option><option value="commercial">Comercial</option><option value="investment">Inversión</option><option value="beach_house">Casas cerca del mar</option></select></label>
        <label><span>Presupuesto</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Sin límite</option><option value="50000">Hasta $50,000</option><option value="100000">Hasta $100,000</option><option value="150000">Hasta $150,000</option><option value="300000">Hasta $300,000</option><option value="500000">Hasta $500,000</option><option value="1000000">Hasta $1,000,000</option></select></label>
        <label><span>Habitaciones</span><select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1 o más</option><option value="2">2 o más</option><option value="3">3 o más</option><option value="4">4 o más</option></select></label>
        <label><span>Baños</span><select value={bathrooms} onChange={(event) => setBathrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1 o más</option><option value="2">2 o más</option><option value="3">3 o más</option></select></label>
        <button type="button" className="drg-filter-reset" onClick={clearFilters}>Limpiar</button>
      </form>

      <div className="drg-results-toolbar">
        <p>{loading ? "Cargando propiedades…" : String(filtered.length) + " propiedades"}</p>
        <label>Ordenar por <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="recent">Más recientes</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="featured">Destacadas</option></select></label>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="drg-empty"><h2>No encontramos propiedades con estos filtros.</h2><p>Prueba otra ubicación o amplía tu búsqueda.</p><button type="button" onClick={clearFilters}>Limpiar filtros</button></div>
      ) : (
        <div className="drg-properties-grid">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
      )}
    </section>
  );
}
