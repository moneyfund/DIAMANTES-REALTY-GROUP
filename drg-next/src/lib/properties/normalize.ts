import type { Property } from "@/types/property";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeProperty(id: string, raw: Record<string, unknown>): Property {
  const title = asString(raw.title) || asString(raw.titulo) || asString(raw.nombre);
  const location = asString(raw.city) || asString(raw.location) || asString(raw.ubicacion);
  const priceUsd = asNumber(raw.priceUsd) ?? asNumber(raw.price) ?? asNumber(raw.precio);
  const type = asString(raw.type) || asString(raw.tipo);
  const operation =
    asString(raw.operationType) ||
    asString(raw.tipoOperacion) ||
    asString(raw.operation) ||
    asString(raw.operacion);

  return {
    id,
    title,
    location,
    priceUsd,
    type,
    operation,
    coverImage:
      asString(raw.coverImage) ||
      asString(raw.image) ||
      asString(raw.imagen) ||
      null,
    bedrooms: asNumber(raw.bedrooms) ?? asNumber(raw.habitaciones),
    bathrooms: asNumber(raw.bathrooms) ?? asNumber(raw.banos),
    area: asNumber(raw.area),
    status: asString(raw.status) || "available",
    raw
  };
}
