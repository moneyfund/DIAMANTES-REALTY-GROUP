import {
  getPropertyCoverImage,
  getPropertyImages,
  getPropertyTypeLabel,
  isPublicProperty,
  normalizeOperation,
  normalizePropertyType,
  normalizeStatus,
  toFiniteNumber
} from "./compat";
import type { Property } from "@/types/property";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProperty(id: string, raw: Record<string, unknown>): Property {
  const title =
    asString(raw.title) ||
    asString(raw.titulo) ||
    asString(raw.propertyTitle) ||
    asString(raw.nombre) ||
    asString(raw.headline);

  const location =
    asString(raw.city) ||
    asString(raw.location) ||
    asString(raw.ubicacion);

  const priceUsd =
    toFiniteNumber(raw.priceUsd) ??
    toFiniteNumber(raw.price) ??
    toFiniteNumber(raw.precio);

  const type = normalizePropertyType(raw.propertyType ?? raw.type ?? raw.tipo);

  const operation = normalizeOperation(
    raw.operationType ??
    raw.tipoOperacion ??
    raw.operation ??
    raw.operacion ??
    raw.transactionType ??
    raw.listingType ??
    raw.purpose ??
    raw.mode
  );

  return {
    id,
    title,
    location,
    priceUsd,
    type,
    typeLabel: getPropertyTypeLabel(type),
    operation,
    coverImage: getPropertyCoverImage(raw),
    images: getPropertyImages(raw),
    bedrooms: toFiniteNumber(raw.bedrooms) ?? toFiniteNumber(raw.habitaciones),
    bathrooms: toFiniteNumber(raw.bathrooms) ?? toFiniteNumber(raw.banos),
    area: toFiniteNumber(raw.areaValue) ?? toFiniteNumber(raw.area),
    areaUnit: asString(raw.areaUnit),
    status: normalizeStatus(raw.status),
    description: asString(raw.description) || asString(raw.descripcion),
    publicVisible: isPublicProperty(raw),
    raw
  };
}
