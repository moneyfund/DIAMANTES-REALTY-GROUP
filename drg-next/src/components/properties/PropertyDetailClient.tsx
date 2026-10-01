"use client";

import Link from "next/link";
import { Bath, BedDouble, Car, Droplets, LandPlot, MapPin, Ruler, Route, Shield, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readPropertyById } from "@/lib/firebase/properties";
import { readAgentById } from "@/lib/firebase/agents";
import { USD_TO_NIO_RATE } from "@/lib/properties/constants";
import {
  getPropertyCoordinates,
  getPropertyFeatures,
  getPropertyVideo,
  getPublishingAgentId,
  getPublishingAgentName,
  getPublishingAgentPhone
} from "@/lib/properties/detail";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { PropertyDetailGallery } from "./PropertyDetailGallery";
import { PropertyShareActions } from "./PropertyShareActions";
import { PropertyInteractionsReadOnly } from "./PropertyInteractionsReadOnly";

const iconByLabel: Record<string, typeof Ruler> = {
  "Habitaciones": BedDouble,
  "Baños": Bath,
  "Área": Ruler,
  "Área de construcción": Ruler,
  "Área de terreno": LandPlot,
  "Parqueo": Car,
  "Topografía": LandPlot,
  "Acceso": Route,
  "Agua": Droplets,
  "Electricidad": Zap,
  "Seguridad": Shield,
  "Uso": LandPlot
};

function operationLabel(value: string) {
  if (value === "alquiler") return "Alquiler";
  if (value === "venta_renta") return "Venta o alquiler";
  return "Venta";
}

function cleanPhone(value: string) {
  if (!value) return "";
  try {
    if (value.includes("wa.me/")) {
      const parsed = new URL(value.startsWith("http") ? value : "https://" + value);
      const path = parsed.pathname.replace(/\D+/g, "");
      if (path) return path;
    }
  } catch {}
  return value.replace(/\D+/g, "");
}

export function PropertyDetailClient({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const nextProperty = await readPropertyById(propertyId);
        if (cancelled) return;
        if (!nextProperty) { setStatus("missing"); return; }
        setProperty(nextProperty);
        const agentId = getPublishingAgentId(nextProperty);
        if (agentId) {
          const nextAgent = await readAgentById(agentId);
          if (!cancelled) setAgent(nextAgent);
        }
        if (!cancelled) setStatus("ready");
      } catch (error) {
        console.error("[DRG property detail]", error);
        if (!cancelled) setStatus("error");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [propertyId]);

  const coordinates = useMemo(() => property ? getPropertyCoordinates(property) : null, [property]);
  const features = useMemo(() => property ? getPropertyFeatures(property) : [], [property]);
  const video = useMemo(() => property ? getPropertyVideo(property) : null, [property]);

  if (status === "loading") return <div className="drg-detail-state">Cargando propiedad…</div>;
  if (status === "missing") return <div className="drg-detail-state"><h1>Propiedad no encontrada</h1><Link href="/propiedades">Ver propiedades</Link></div>;
  if (status === "error" || !property) return <div className="drg-detail-state"><h1>No pudimos cargar esta propiedad.</h1><Link href="/propiedades">Volver al catálogo</Link></div>;

  const areaDisplay = property.area ? property.area.toLocaleString("en-US") + " " + (property.areaUnit || "m²") : "No especificada";
  const pricePerArea = property.priceUsd && property.area ? property.priceUsd / property.area : null;
  const nio = property.priceUsd ? Math.round(property.priceUsd * USD_TO_NIO_RATE) : null;
  const publishingName = agent?.name || getPublishingAgentName(property);
  const publishingPhone = cleanPhone(agent?.whatsapp || agent?.phone || getPublishingAgentPhone(property));
  const agentId = agent?.id || getPublishingAgentId(property);

  const mapUrl = coordinates
    ? "https://www.openstreetmap.org/export/embed.html?bbox=" + (coordinates[1] - .02) + "%2C" + (coordinates[0] - .015) + "%2C" + (coordinates[1] + .02) + "%2C" + (coordinates[0] + .015) + "&layer=mapnik&marker=" + coordinates[0] + "%2C" + coordinates[1]
    : "";
  const routeUrl = coordinates ? "https://www.google.com/maps/dir/?api=1&destination=" + coordinates[0] + "%2C" + coordinates[1] : "";

  return (
    <div className="drg-property-detail">
      <div className="drg-detail-top">
        <PropertyDetailGallery images={property.images.length ? property.images : (property.coverImage ? [property.coverImage] : [])} title={property.title} />

        <aside className="drg-detail-summary">
          <p className="drg-detail-badge">{property.typeLabel || "Propiedad"} en {operationLabel(property.operation).toLowerCase()}</p>
          {["sold","vendida","vendido"].includes(property.status) ? <p className="drg-detail-sold">VENDIDA</p> : null}
          <h1>{property.title || "Propiedad en Nicaragua"}</h1>
          <p className="drg-detail-location"><MapPin size={15} /> {property.location || "Nicaragua"}</p>
          <div className="drg-detail-price">
            {property.priceUsd ? <><strong>{"$"}{property.priceUsd.toLocaleString("en-US")} USD</strong><span>{"C$"}{nio?.toLocaleString("en-US")} NIO</span></> : <strong>Precio no disponible</strong>}
          </div>
          <div className="drg-detail-metrics">
            <p><b>Área</b><span>{areaDisplay}</span></p>
            <p><b>Precio por área</b><span>{pricePerArea ? "$" + pricePerArea.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " / " + (property.areaUnit || "m²") : "No disponible"}</span></p>
          </div>
          <PropertyShareActions title={property.title || "Propiedad"} whatsappPhone={publishingPhone} />
        </aside>
      </div>

      <section className="drg-detail-extended">
        <div>
          <h2>Descripción de la propiedad</h2>
          <p className="drg-detail-description">{property.description || "Información descriptiva pendiente de actualización."}</p>
        </div>
        <div className="drg-detail-features-block">
          <h2>Características de la propiedad</h2>
          <div className="drg-detail-features">
            {features.map((feature) => {
              const Icon = iconByLabel[feature.label] || Ruler;
              return <article key={feature.label}><Icon aria-hidden="true" /><span><strong>{feature.label}</strong><em>{feature.value}</em></span></article>;
            })}
            <article><MapPin aria-hidden="true" /><span><strong>Ubicación</strong><em>{property.location || "Nicaragua"}</em></span></article>
          </div>
        </div>
        {publishingName || agentId ? (
          <footer className="drg-detail-agent-row">
            {publishingName ? <p><strong>Publicado por</strong><br />{publishingName}</p> : <span />}
            {agentId ? <Link href={"/agente/" + agentId}>Para más información aquí</Link> : null}
          </footer>
        ) : null}
      </section>

      {video ? (
        <section className="drg-detail-video">
          <p className="drg-kicker">Recorrido audiovisual</p><h2>Video de la propiedad</h2>
          <div className="drg-detail-video-frame"><iframe src={video.embedUrl} title={"Video de " + property.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
        </section>
      ) : null}

      <section className="drg-detail-map">
        <div className="drg-detail-map-head"><h2>Ubicación de la propiedad</h2>{routeUrl ? <a href={routeUrl} target="_blank" rel="noreferrer">Cómo llegar ↗</a> : null}</div>
        {mapUrl ? <iframe src={mapUrl} title={"Mapa de " + property.title} loading="lazy" /> : <div className="drg-detail-map-empty">Esta propiedad todavía no tiene coordenadas públicas disponibles.</div>}
      </section>

      <PropertyInteractionsReadOnly propertyId={property.id} />
    </div>
  );
}
