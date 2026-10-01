import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAgent } from "../src/lib/agents/normalize";
import { getPropertyCoordinates, getPublishingAgentId, getPropertyFeatures } from "../src/lib/properties/detail";
import { normalizeProperty } from "../src/lib/properties/normalize";

test("agent normalization preserves production aliases", () => {
  const agent = normalizeAgent("agent-1", {
    name: "Ana Reyes",
    cargo: "Asesora inmobiliaria",
    ubicacion: "Matagalpa",
    telefono: "8888 8888",
    profilePhoto: "https://example.com/agent.jpg",
    active: true
  });
  assert.equal(agent.id, "agent-1");
  assert.equal(agent.role, "Asesora inmobiliaria");
  assert.equal(agent.location, "Matagalpa");
  assert.equal(agent.phone, "8888 8888");
  assert.equal(agent.photo, "https://example.com/agent.jpg");
  assert.equal(agent.active, true);
});

test("inactive agents are recognized", () => {
  assert.equal(normalizeAgent("x", { name: "X", status: "inactive" }).active, false);
  assert.equal(normalizeAgent("x", { name: "X", active: false }).active, false);
});

test("property coordinates support nested production shapes", () => {
  const property = normalizeProperty("p1", {
    title: "Casa",
    city: "Matagalpa",
    coordinates: { latitude: 12.93, longitude: -85.92 },
    publicationStatus: "approved",
    publicVisible: true
  });
  assert.deepEqual(getPropertyCoordinates(property), [12.93, -85.92]);
});

test("publishing agent id supports legacy aliases", () => {
  const property = normalizeProperty("p1", {
    title: "Casa",
    city: "Matagalpa",
    createdBy: "agent-123",
    publicationStatus: "approved",
    publicVisible: true
  });
  assert.equal(getPublishingAgentId(property), "agent-123");
});

test("detail features include normalized bedrooms bathrooms and area", () => {
  const property = normalizeProperty("p1", {
    title: "Casa",
    city: "Matagalpa",
    bedrooms: 3,
    bathrooms: 2,
    area: 240,
    areaUnit: "m²",
    publicationStatus: "approved",
    publicVisible: true
  });
  const labels = getPropertyFeatures(property).map((feature) => feature.label);
  assert.ok(labels.includes("Habitaciones"));
  assert.ok(labels.includes("Baños"));
  assert.ok(labels.includes("Área"));
});
