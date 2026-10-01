import assert from "node:assert/strict";
import test from "node:test";
import {
  getPropertyCoverImage,
  getPropertyImages,
  isPublicProperty,
  normalizeOperation,
  normalizePropertyType,
  toFiniteNumber
} from "../src/lib/properties/compat";
import { normalizeProperty } from "../src/lib/properties/normalize";

test("legacy properties remain public when publication fields are absent", () => {
  assert.equal(isPublicProperty({}), true);
  assert.equal(isPublicProperty({ visibility: "public" }), true);
});

test("new publication model requires approved + publicVisible", () => {
  assert.equal(isPublicProperty({ publicationStatus: "approved", publicVisible: true }), true);
  assert.equal(isPublicProperty({ publicationStatus: "approved", publicVisible: false }), false);
  assert.equal(isPublicProperty({ publicationStatus: "draft", publicVisible: true }), false);
  assert.equal(isPublicProperty({ visibility: "agents", publicationStatus: "approved", publicVisible: true }), false);
});

test("property type aliases match legacy behavior", () => {
  assert.equal(normalizePropertyType("Casa"), "house");
  assert.equal(normalizePropertyType("Fincas"), "farm");
  assert.equal(normalizePropertyType("Casa cerca del mar"), "beach_house");
});

test("operation aliases match legacy behavior", () => {
  assert.equal(normalizeOperation("Venta"), "venta");
  assert.equal(normalizeOperation("Alquiler"), "alquiler");
  assert.equal(normalizeOperation("Venta y renta"), "venta_renta");
});

test("numeric parsing accepts formatted legacy values", () => {
  assert.equal(toFiniteNumber("$168,000 USD"), 168000);
  assert.equal(toFiniteNumber("3307.42"), 3307.42);
  assert.equal(toFiniteNumber("no disponible"), 0);
});

test("cover image prefers explicit cover when valid", () => {
  const raw = {
    images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    coverImage: "https://example.com/b.jpg"
  };
  assert.deepEqual(getPropertyImages(raw), [
    "https://example.com/a.jpg",
    "https://example.com/b.jpg"
  ]);
  assert.equal(getPropertyCoverImage(raw), "https://example.com/b.jpg");
});

test("normalizeProperty preserves common production aliases", () => {
  const property = normalizeProperty("abc123", {
    titulo: "Casa moderna",
    ubicacion: "Matagalpa",
    precio: "$168,000",
    tipo: "Casa",
    tipoOperacion: "Venta",
    habitaciones: 3,
    banos: 2,
    area: "240",
    areaUnit: "m²",
    publicationStatus: "approved",
    publicVisible: true
  });

  assert.equal(property.id, "abc123");
  assert.equal(property.title, "Casa moderna");
  assert.equal(property.location, "Matagalpa");
  assert.equal(property.priceUsd, 168000);
  assert.equal(property.type, "house");
  assert.equal(property.operation, "venta");
  assert.equal(property.bedrooms, 3);
  assert.equal(property.bathrooms, 2);
  assert.equal(property.publicVisible, true);
});
