"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { readProperties } from "@/lib/firebase/properties";
import { getPropertyCoordinates } from "@/lib/properties/detail";
import type { Property } from "@/types/property";
import { PropertiesMapCanvas } from "./PropertiesMapCanvas";

type SortMode = "recent" | "price-asc" | "price-desc" | "area-desc" | "name-asc";

function normalized(value: unknown) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function timestamp(property: Property) {
  const value = property.raw.createdAt || property.raw.updatedAt;
  if (value && typeof value === "object" && "seconds" in value && typeof (value as { seconds?: unknown }).seconds === "number") {
    return (value as { seconds: number }).seconds;
  }
  return typeof value === "number" ? value : 0;
}

function MapCard({ property, active, onSelect }: { property: Property; active: boolean; onSelect: () => void }) {
  return (
    <article className={"drg-map-card" + (active ? " is-active" : "")} onMouseEnter={onSelect}>
      <Link className="drg-map-card-image" href={"/propiedad/" + property.id}>
        {property.coverImage ? <Image src={property.coverImage} alt={property.title} fill sizes="150px" /> : <div />}
      </Link>
      <div className="drg-map-card-body">
        <p className="drg-map-card-price">{property.priceUsd ? "$" + property.priceUsd.toLocaleString("en-US") + " USD" : "Precio no disponible"}</p>
        <h3><Link href={"/propiedad/" + property.id}>{property.title || "Propiedad"}</Link></h3>
        <p>{property.location || "Nicaragua"}</p>
        <small>{property.typeLabel || "Propiedad"} · {property.operation === "alquiler" ? "Alquiler" : "Venta"}</small>
      </div>
    </article>
  );
}

export function MapExperienceClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [operation, setOperation] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [geoResults, setGeoResults] = useState<Array<{ display_name: string; lat: number; lon: number }>>([]);
  const [focus, setFocus] = useState<[number, number] | null>(null);

  useEffect(() => {
    readProperties(200).then((result) => setProperties(result.properties)).catch(console.error);
  }, []);

  useEffect(() => {
    const value = search.trim();
    if (value.length < 3) { setGeoResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value, format: "jsonv2", countrycodes: "ni", addressdetails: "1", limit: "5", "accept-language": "es" });
        const response = await fetch("https://nominatim.openstreetmap.org/search?" + params.toString(), { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as Array<{ display_name?: string; lat?: string; lon?: string }>;
        setGeoResults(data.map((item) => ({ display_name: String(item.display_name || ""), lat: Number(item.lat), lon: Number(item.lon) })).filter((item) => item.display_name && Number.isFinite(item.lat) && Number.isFinite(item.lon)));
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") console.warn("[DRG geocoding]", error);
      }
    }, 500);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search]);

  const filtered = useMemo(() => {
    const needle = normalized(search);
    const budget = Number(maxPrice || 0);
    const minBedrooms = Number(bedrooms || 0);
    const minBathrooms = Number(bathrooms || 0);

    const result = properties.filter((property) => {
      const searchable = [
        property.title, property.location, property.raw.city, property.raw.department, property.raw.departamento,
        property.raw.zone, property.raw.zona, property.raw.address, property.raw.direccion, property.raw.municipality, property.raw.municipio
      ].map(normalized).join(" ");
      return (!needle || searchable.includes(needle))
        && (!operation || property.operation === operation || property.operation === "venta_renta")
        && (!type || property.type === type)
        && (!budget || Boolean(property.priceUsd && property.priceUsd <= budget))
        && (!minBedrooms || Boolean(property.bedrooms && property.bedrooms >= minBedrooms))
        && (!minBathrooms || Boolean(property.bathrooms && property.bathrooms >= minBathrooms));
    });

    return result.sort((a, b) => {
      if (sort === "price-asc") return (a.priceUsd || Number.MAX_SAFE_INTEGER) - (b.priceUsd || Number.MAX_SAFE_INTEGER);
      if (sort === "price-desc") return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sort === "area-desc") return (b.area || 0) - (a.area || 0);
      if (sort === "name-asc") return a.title.localeCompare(b.title, "es");
      return timestamp(b) - timestamp(a);
    });
  }, [properties, search, operation, type, maxPrice, bedrooms, bathrooms, sort]);

  const geolocated = useMemo(() => filtered.filter((property) => Boolean(getPropertyCoordinates(property))), [filtered]);

  const selectProperty = useCallback((id: string) => setActiveId(id), []);

  return (
    <main className={"drg-map-page is-" + mobileView}>
      <section className="drg-map-toolbar">
        <div className="drg-map-search">
          <div className="drg-map-search-input">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setFocus(null); }} placeholder="Busca ciudad, barrio, zona o dirección" aria-label="Buscar ubicación" />
            {search ? <button type="button" onClick={() => { setSearch(""); setGeoResults([]); setFocus(null); }}>×</button> : null}
            {geoResults.length ? <div className="drg-geo-results">{geoResults.map((result) => <button type="button" key={result.display_name} onClick={() => { setSearch(result.display_name.split(",")[0]?.trim() || result.display_name); setFocus([result.lat, result.lon]); setGeoResults([]); }}>{result.display_name}</button>)}</div> : null}
          </div>
          <details className="drg-map-filters">
            <summary>Filtros <small>Ajustar búsqueda</small></summary>
            <div>
              <label>Operación<select value={operation} onChange={(event) => setOperation(event.target.value)}><option value="">Venta o alquiler</option><option value="venta">Venta</option><option value="alquiler">Alquiler</option></select></label>
              <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option><option value="house">Casa</option><option value="apartment">Apartamento</option><option value="land">Terreno</option><option value="farm">Finca</option><option value="quinta">Quinta</option><option value="warehouse">Bodega</option><option value="commercial">Comercial</option></select></label>
              <label>Precio máximo<select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Sin límite</option><option value="50000">$50,000</option><option value="100000">$100,000</option><option value="300000">$300,000</option><option value="500000">$500,000</option><option value="1000000">$1,000,000</option></select></label>
              <label>Habitaciones<select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>
              <label>Baños<select value={bathrooms} onChange={(event) => setBathrooms(event.target.value)}><option value="">Cualquiera</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>
            </div>
          </details>
        </div>
      </section>

      <div className="drg-map-mobile-toggle"><button className={mobileView === "map" ? "is-active" : ""} onClick={() => setMobileView("map")}>Mapa</button><button className={mobileView === "list" ? "is-active" : ""} onClick={() => setMobileView("list")}>Lista</button></div>

      <section className="drg-map-split">
        <aside className="drg-map-list">
          <header>
            <div><p className="drg-kicker">Diamantes Realty Group</p><h1>Propiedades disponibles</h1><p>{filtered.length} resultados · {geolocated.length} en mapa</p></div>
            <label>Ordenar por<select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="recent">Más recientes</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option><option value="area-desc">Mayor área</option><option value="name-asc">Nombre A-Z</option></select></label>
          </header>
          <div className="drg-map-card-list">{filtered.map((property) => <MapCard key={property.id} property={property} active={property.id === activeId} onSelect={() => selectProperty(property.id)} />)}</div>
        </aside>
        <section className="drg-map-panel"><PropertiesMapCanvas properties={geolocated} activeId={activeId} onSelect={selectProperty} focus={focus} /></section>
      </section>
    </main>
  );
}
