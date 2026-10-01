import type { Property } from "@/types/property";
import { getDynamicFieldsForType } from "./fields";

function objectValue(raw: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[part];
  }, raw);
}

export function stringFrom(raw: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = objectValue(raw, key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function numberFrom(raw: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = objectValue(raw, key);
    if (value === null || value === undefined || value === "") continue;
    const parsed = typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.,-]/g, "").replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getPropertyCoordinates(property: Property): [number, number] | null {
  const raw = property.raw;
  const candidates: [string[], string[]][] = [
    [["latitude"], ["longitude"]],
    [["lat"], ["lng"]],
    [["latitud"], ["longitud"]],
    [["locationLat"], ["locationLng"]],
    [["mapLat"], ["mapLng"]],
    [["coordinates.lat","coordinates.latitude","coordinates._lat"], ["coordinates.lng","coordinates.longitude","coordinates._long"]],
    [["coordenadas.lat","coordenadas.latitude"], ["coordenadas.lng","coordenadas.longitude"]],
    [["location.lat","location.latitude"], ["location.lng","location.longitude"]],
    [["mapPosition.lat"], ["mapPosition.lng"]]
  ];

  for (const [latKeys, lngKeys] of candidates) {
    const lat = numberFrom(raw, latKeys);
    const lng = numberFrom(raw, lngKeys);
    if (lat === null || lng === null) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) continue;
    return [lat, lng];
  }
  return null;
}

export type PropertyFeature = { label: string; value: string };

export function getPropertyFeatures(property: Property): PropertyFeature[] {
  const raw = property.raw;
  const features: PropertyFeature[] = [];
  const push = (label: string, value: unknown) => {
    const normalized = typeof value === "number" ? String(value) : String(value ?? "").trim();
    if (!normalized || normalized === "0" || normalized === "null" || normalized === "undefined") return;
    if (!features.some((item) => item.label === label)) features.push({ label, value: normalized });
  };

  push("Habitaciones", property.bedrooms);
  push("Baños", property.bathrooms);
  if (property.area) push("Área", property.area.toLocaleString("en-US") + " " + (property.areaUnit || "m²"));

  const entries: [string, string[]][] = [
    ["Área de construcción", ["constructionArea","propertyDetails.constructionArea"]],
    ["Área de terreno", ["landArea","propertyDetails.landArea"]],
    ["Parqueo", ["parking","parkingSpaces","propertyDetails.parking"]],
    ["Topografía", ["topography","topografia","propertyDetails.topography"]],
    ["Acceso", ["streetType","roadType","access","acceso"]],
    ["Agua", ["water","agua","waterService","propertyDetails.water"]],
    ["Electricidad", ["electricity","electricidad","propertyDetails.electricity"]],
    ["Uso", ["use","uso","landUse","propertyDetails.use"]],
    ["Seguridad", ["security","seguridad","propertyDetails.security"]]
  ];

  for (const [label, keys] of entries) {
    const numeric = numberFrom(raw, keys);
    if (numeric !== null) push(label, numeric);
    else push(label, stringFrom(raw, keys));
  }

  const details =
    raw.propertyDetails && typeof raw.propertyDetails === "object"
      ? raw.propertyDetails as Record<string, unknown>
      : {};
  const dynamicFields = getDynamicFieldsForType(property.type);
  for (const [key, inputType, label] of dynamicFields) {
    if (features.some((item) => item.label === label)) continue;
    const direct = raw[key];
    const nested = details[key];
    const value = direct !== undefined && direct !== null && direct !== "" ? direct : nested;
    if (value === undefined || value === null || value === "") continue;

    if (inputType === "number") {
      const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
      if (!Number.isFinite(numeric) || numeric <= 0) continue;
      const areaKeys = new Set(["constructionArea","landArea","totalArea"]);
      const display = areaKeys.has(key)
        ? numeric.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + (String(details.areaUnit || raw.areaUnit || property.areaUnit || "m²"))
        : numeric.toLocaleString("en-US", { maximumFractionDigits: 2 });
      push(label, display);
      continue;
    }

    const text = String(value).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (["0","false","ninguno","ninguna","n/a","na","no especificado"].includes(normalized)) continue;
    push(label, text.length > 90 ? text.slice(0, 87).trim() + "…" : text);
  }

  return features.slice(0, 16);
}

export function getPublishingAgentId(property: Property) {
  return stringFrom(property.raw, ["agentId","agenteId","createdBy","ownerId","userId"]);
}

export function getPublishingAgentName(property: Property) {
  return stringFrom(property.raw, ["agentName","nombreAgente"]);
}

export function getPublishingAgentPhone(property: Property) {
  return stringFrom(property.raw, ["agentWhatsapp","agentWhatsApp","agentPhone","agentTelefono","whatsapp","telefonoAgente"]);
}

export function getPropertyVideo(property: Property): { type: "youtube" | "tiktok"; url: string; embedUrl: string } | null {
  const raw = property.raw;
  const nested = raw.video && typeof raw.video === "object" ? raw.video as Record<string, unknown> : null;
  const directUrl = typeof raw.video === "string" ? raw.video : "";
  const url = String(nested?.url || raw.videoUrl || directUrl || "").trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let id = "";
      if (host.includes("youtu.be")) id = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
      else if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) id = parsed.pathname.split("/")[2] || "";
      else id = parsed.searchParams.get("v") || "";
      return id ? { type: "youtube", url, embedUrl: "https://www.youtube.com/embed/" + id } : null;
    }
    if (host.includes("tiktok.com")) {
      const id = parsed.pathname.match(/\/video\/(\d+)/i)?.[1] || "";
      return id ? { type: "tiktok", url, embedUrl: "https://www.tiktok.com/embed/v2/" + id } : null;
    }
  } catch {}
  return null;
}
