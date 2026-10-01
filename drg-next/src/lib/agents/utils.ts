import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { getPublishingAgentId } from "@/lib/properties/detail";

export function getAgentInitials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") : "DR";
}

export function normalizeExternalUrl(value: string, network?: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (network === "whatsapp") {
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^wa\.me\//i.test(raw)) return "https://" + raw;
    const phone = raw.replace(/\D+/g, "");
    return phone ? "https://wa.me/" + phone : "";
  }
  return /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
}

export function propertiesForAgent(properties: Property[], agentId: string) {
  return properties.filter((property) => getPublishingAgentId(property) === agentId);
}

export function agentCoverageDepartments(agent: Agent, properties: Property[]) {
  const departments = [
    "Boaco","Carazo","Chinandega","Chontales","Estelí","Granada","Jinotega",
    "León","Madriz","Managua","Masaya","Matagalpa","Nueva Segovia","Rivas","Río San Juan"
  ];
  const values: unknown[] = [
    agent.location,
    agent.raw.coverage,
    agent.raw.cobertura,
    agent.raw.departments,
    agent.raw.coverageDepartments,
    ...properties.flatMap((property) => [
      property.location,
      property.raw.department,
      property.raw.departamento,
      property.raw.municipality,
      property.raw.municipio
    ])
  ];

  const haystack = values.flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value as Record<string, unknown>);
    return [value];
  }).map((value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());

  return departments.filter((department) => {
    const needle = department.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return haystack.some((value) => value.includes(needle));
  });
}
