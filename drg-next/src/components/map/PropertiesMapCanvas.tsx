"use client";

import { useEffect, useRef, useState } from "react";
import type { Property } from "@/types/property";
import { getPropertyCoordinates } from "@/lib/properties/detail";

function markerPrice(property: Property) {
  if (!property.priceUsd) return "Ver";
  if (property.priceUsd >= 1000000) return "$" + (property.priceUsd / 1000000).toFixed(property.priceUsd % 1000000 ? 1 : 0) + "M";
  if (property.priceUsd >= 1000) return "$" + Math.round(property.priceUsd / 1000) + "K";
  return "$" + property.priceUsd.toLocaleString("en-US");
}

export function PropertiesMapCanvas({
  properties,
  activeId,
  onSelect,
  focus
}: {
  properties: Property[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  focus?: [number, number] | null;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !elementRef.current || mapRef.current) return;
      const map = L.map(elementRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([12.8654, -85.2072], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 80);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!mapReady || !map || !layer) return;

    void import("leaflet").then((L) => {
      layer.clearLayers();
      const bounds: [number, number][] = [];

      for (const property of properties) {
        const coordinates = getPropertyCoordinates(property);
        if (!coordinates) continue;
        bounds.push(coordinates);
        const active = property.id === activeId;
        const icon = L.divIcon({
          className: "drg-map-marker-host",
          html: '<span class="drg-map-price-marker' + (active ? " is-active" : "") + '">' + markerPrice(property) + "</span>",
          iconSize: [62, 32],
          iconAnchor: [31, 16]
        });
        const marker = L.marker(coordinates, { icon }).addTo(layer);
        marker.on("click", () => onSelect?.(property.id));
        marker.bindTooltip(property.title || "Propiedad", { direction: "top", offset: [0, -12] });
      }

      if (focus) {
        map.setView(focus, 13, { animate: true });
      } else if (!activeId && bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else if (!activeId && bounds.length > 1) {
        map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
      }
    });
  }, [properties, activeId, focus, onSelect, mapReady]);

  return <div ref={elementRef} className="drg-map-canvas" aria-label="Mapa interactivo de propiedades" />;
}
