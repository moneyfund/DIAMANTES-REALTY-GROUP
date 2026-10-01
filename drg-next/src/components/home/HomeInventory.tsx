"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readProperties } from "@/lib/firebase/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { BrandMarquee } from "./BrandMarquee";
import type { Property } from "@/types/property";

function isFeatured(property: Property) {
  const rawTags = [property.raw.highlightedTags, property.raw.highlightTags, property.raw.tags].flat().filter(Boolean);
  const tags = rawTags.map(String).map((value) => value.toLowerCase());
  return property.raw.featured === true || property.raw.destacado === true || tags.includes("exclusiva") || tags.includes("oportunidad");
}

function timestamp(property: Property) {
  const value = property.raw.createdAt || property.raw.updatedAt;
  if (value && typeof value === "object" && "seconds" in value && typeof (value as { seconds?: unknown }).seconds === "number") {
    return (value as { seconds: number }).seconds;
  }
  return typeof value === "number" ? value : 0;
}

function InventorySection({ title, items, href = "/propiedades" }: { title: string; items: Property[]; href?: string }) {
  return (
    <section className="drg-home-section drg-container">
      <div className="drg-section-head"><h2>{title}</h2><Link href={href}>Explora más propiedades</Link></div>
      <div className="drg-home-slider">{items.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
    </section>
  );
}

export function HomeInventory() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    readProperties(200).then((result) => setProperties(result.properties)).catch(console.error);
  }, []);

  const sets = useMemo(() => {
    const featured = properties.filter(isFeatured);
    const recent = [...properties].sort((a, b) => timestamp(b) - timestamp(a));
    return {
      featured: (featured.length ? featured : properties).slice(0, 12),
      recent: recent.slice(0, 12),
      land: properties.filter((property) => property.type === "farm" || property.type === "land").slice(0, 12)
    };
  }, [properties]);

  return (
    <>
      <InventorySection title="Propiedades destacadas" items={sets.featured} />
      <InventorySection title="Propiedades recientes" items={sets.recent} />
      <InventorySection title="Fincas y terrenos" items={sets.land} href="/propiedades?tipo=land" />
      <BrandMarquee />
    </>
  );
}
