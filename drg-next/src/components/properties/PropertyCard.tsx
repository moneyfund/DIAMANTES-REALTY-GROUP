"use client";

import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/types/property";
import { USD_TO_NIO_RATE } from "@/lib/properties/constants";
import { MapPin, Share2 } from "lucide-react";
import { PropertyFeatureIcon } from "./PropertyFeatureIcon";

function operationLabel(value: string) {
  if (value === "alquiler") return "Alquiler";
  if (value === "venta_renta") return "Venta o alquiler";
  return "Venta";
}

function statusLabel(property: Property) {
  const status = property.status;
  if (["sold","vendida","vendido"].includes(status)) return "Vendida";
  if (["rented","alquilada","alquilado"].includes(status)) return "Alquilada";
  if (["pending","pendiente","reserved","reservada","reservado"].includes(status)) return "Pendiente";
  if (property.raw.exclusive === true || property.raw.exclusiva === true) return "Exclusiva";
  if (property.raw.featured === true || property.raw.destacado === true) return "Destacada";
  return "";
}

export function PropertyCard({ property }: { property: Property }) {
  const special = statusLabel(property);
  const rent = property.operation === "alquiler";
  const nio = property.priceUsd ? Math.round(property.priceUsd * USD_TO_NIO_RATE) : null;
  const details = [
    property.bedrooms ? {label:"Habitaciones",value:String(property.bedrooms)} : null,
    property.bathrooms ? {label:"Baños",value:String(property.bathrooms)} : null,
    property.area ? {label:"Área",value:property.area.toLocaleString("en-US") + " " + (property.areaUnit || "m²")} : null
  ].filter((item): item is {label:string;value:string} => Boolean(item)).slice(0, 3);

  async function share() {
    const url = window.location.origin + "/propiedad/" + property.id;
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, url });
        return;
      } catch {}
    }
    await navigator.clipboard?.writeText(url);
  }

  return (
    <article className="drg-property-card">
      <div className="drg-property-shell">
        <Link className="drg-property-media" href={"/propiedad/" + property.id}>
          {property.coverImage ? (
            <Image src={property.coverImage} alt={property.title || "Propiedad"} fill sizes="(max-width:768px) 86vw, (max-width:1100px) 45vw, 31vw" className="drg-property-image" />
          ) : (
            <div className="drg-property-placeholder">Sin imagen</div>
          )}
          <span className="drg-property-gradient" />
          <span className={"drg-property-badge" + (rent ? " is-rent" : "")}>{operationLabel(property.operation)}</span>
          {special ? <span className="drg-property-special">{special}</span> : null}
          {property.typeLabel ? <span className="drg-property-type">{property.typeLabel}</span> : null}
        </Link>

        <div className="drg-property-body">
          <p className="drg-property-price">
            {property.priceUsd ? (
              <>
                <strong>{"$"}{property.priceUsd.toLocaleString("en-US")} USD{rent ? <small> / mes</small> : null}</strong>
                <span>{"C$"}{nio?.toLocaleString("en-US")} NIO</span>
              </>
            ) : "Precio no disponible"}
          </p>
          <h3><Link href={"/propiedad/" + property.id}>{property.title || "Propiedad en Nicaragua"}</Link></h3>
          <p className="drg-property-location"><MapPin size={14} aria-hidden="true"/> <span>{property.location || "Nicaragua"}</span></p>
          <div className="drg-property-features">{details.map((detail) => <span key={detail.label}><PropertyFeatureIcon label={detail.label} size={15}/>{detail.value}</span>)}</div>
        </div>

        <div className="drg-property-footer">
          <Link className="drg-property-cta" href={"/propiedad/" + property.id}>Ver propiedad <span>↗</span></Link>
          <button className="drg-property-share" type="button" onClick={share} aria-label={"Compartir " + property.title}><Share2 size={17} aria-hidden="true"/></button>
        </div>
      </div>
    </article>
  );
}
