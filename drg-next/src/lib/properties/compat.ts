import { PROPERTY_TYPE_ALIASES, PROPERTY_TYPE_LABELS } from "./constants";

const typeLookup = Object.entries(PROPERTY_TYPE_ALIASES).reduce<Record<string, string>>((lookup, [canonical, aliases]) => {
  for (const alias of aliases) lookup[alias.trim().toLowerCase()] = canonical;
  return lookup;
}, {});

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.,-]/g, "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePropertyType(value: unknown): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  return typeLookup[normalized] ?? normalized;
}

export function getPropertyTypeLabel(value: unknown): string {
  return PROPERTY_TYPE_LABELS[normalizePropertyType(value)] ?? "";
}

export function normalizeOperation(value: unknown): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) return "";

  const hasSale = /\b(venta|comprar|sale)\b|for sale/.test(normalized);
  const hasRent = /\b(alquiler|alquilar|renta|rentar|rent)\b|for rent/.test(normalized);

  if (hasSale && hasRent) return "venta_renta";
  if (hasSale || ["venta (comprar)", "comprar"].includes(normalized)) return "venta";
  if (hasRent) return "alquiler";
  if (["venta/renta", "venta-renta", "venta y renta", "venta/alquiler", "sale/rent"].includes(normalized)) return "venta_renta";
  return normalized;
}

export function isPublicProperty(raw: Record<string, unknown>): boolean {
  const visibility = typeof raw.visibility === "string" ? raw.visibility : "";
  const hasPublicVisibility = !visibility || visibility === "public";

  const approved =
    raw.publicationStatus === "approved" &&
    raw.publicVisible === true;

  const legacy =
    raw.publicationStatus === undefined &&
    raw.publicVisible === undefined;

  return hasPublicVisibility && (approved || legacy);
}

export function normalizeImageList(values: unknown[]): string[] {
  const unique = new Set<string>();

  for (const value of values.flatMap((item) => Array.isArray(item) ? item : [item])) {
    const image = String(value ?? "").trim();
    if (!image || unique.has(image)) continue;
    try {
      const url = new URL(image);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      unique.add(image);
    } catch {
      continue;
    }
  }

  return [...unique];
}

export function getPropertyImages(raw: Record<string, unknown>): string[] {
  return normalizeImageList([
    raw.images,
    raw.imageUrls,
    raw.imagenes,
    raw.coverImage,
    raw.mainImage,
    raw.imageUrl,
    raw.image,
    raw.imagen
  ]);
}

export function getPropertyCoverImage(raw: Record<string, unknown>): string | null {
  const images = getPropertyImages(raw);
  if (!images.length) return null;

  const explicit = typeof raw.coverImage === "string" ? raw.coverImage.trim() : "";
  return explicit && images.includes(explicit) ? explicit : images[0];
}

export function normalizeStatus(value: unknown): string {
  return String(value || "available")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
