"use client";

import Image from "next/image";
import type { Property } from "@/types/property";

function formatPrice(price: number | null) {
  if (!price || price <= 0) return "Precio no disponible";
  return `$${price.toLocaleString("en-US")} USD`;
}

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--drg-border)] bg-white">
      <div className="relative aspect-[4/3] bg-slate-100">
        {property.coverImage ? (
          <Image
            src={property.coverImage}
            alt={property.title || "Propiedad de Diamantes Realty Group"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-[var(--drg-muted)]">Sin imagen</div>
        )}
      </div>
      <div className="p-5">
        <p className="m-0 text-lg font-semibold">{formatPrice(property.priceUsd)}</p>
        <h2 className="mt-2 text-base font-semibold">{property.title || "Propiedad"}</h2>
        <p className="mt-2 text-sm text-[var(--drg-muted)]">{property.location || "Nicaragua"}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--drg-muted)]">
          {property.typeLabel && <span>{property.typeLabel}</span>}
          {property.bedrooms ? <span>{property.bedrooms} hab.</span> : null}
          {property.bathrooms ? <span>{property.bathrooms} baños</span> : null}
          {property.area ? <span>{property.area.toLocaleString("en-US")} {property.areaUnit || "m²"}</span> : null}
        </div>
      </div>
    </article>
  );
}
