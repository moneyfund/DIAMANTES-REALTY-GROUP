import type { Agent } from "@/types/agent";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAgent(id: string, raw: Record<string, unknown>): Agent {
  const status = text(raw.status).toLowerCase();
  return {
    id,
    name: text(raw.name) || "Agente Diamantes Realty Group",
    role: text(raw.role) || text(raw.cargo) || text(raw.position) || "Asesor inmobiliario",
    location: text(raw.location) || text(raw.ubicacion) || text(raw.city) || text(raw.department) || text(raw.departamento) || "Nicaragua",
    description: text(raw.description),
    phone: text(raw.phone) || text(raw.telefono) || text(raw.mobile),
    email: text(raw.email),
    whatsapp: text(raw.whatsapp) || text(raw.whatsApp),
    photo: text(raw.photo) || text(raw.photoURL) || text(raw.photoUrl) || text(raw.profileImage) || text(raw.profilePhoto) || text(raw.avatar) || null,
    license: text(raw.licenseNumber) || text(raw.agentLicenseNumber) || text(raw.carnet),
    instagram: text(raw.instagram),
    facebook: text(raw.facebook),
    tiktok: text(raw.tiktok),
    active: raw.active !== false && status !== "inactive",
    raw
  };
}
