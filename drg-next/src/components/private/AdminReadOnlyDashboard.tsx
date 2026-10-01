"use client";

import { useEffect, useMemo, useState } from "react";
import { readAgents } from "@/lib/firebase/agents";
import { readProperties } from "@/lib/firebase/properties";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { useDrgAuth } from "@/components/auth/AuthProvider";

export function AdminReadOnlyDashboard() {
  const { profile, logout } = useDrgAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  useEffect(() => { void Promise.all([readProperties(200), readAgents()]).then(([p,a]) => {setProperties(p.properties);setAgents(a);}); }, []);
  const stats=useMemo(()=>({
    total:properties.length,
    pending:properties.filter(p=>String(p.raw.publicationStatus||"").toLowerCase()==="pending_review").length,
    approved:properties.filter(p=>p.publicVisible).length,
    agents:agents.length
  }),[properties,agents]);
  return <section className="drg-private-dashboard"><header><div><p className="drg-kicker">DRG 2.0</p><h1>Panel administrativo</h1><p>Vista de migración en modo solo lectura.</p></div><div><span>{profile.user?.email}</span><button onClick={()=>void logout()}>Cerrar sesión</button></div></header><div className="drg-private-stats"><article><strong>{stats.total}</strong><span>Propiedades públicas leídas</span></article><article><strong>{stats.pending}</strong><span>Pendientes detectadas</span></article><article><strong>{stats.approved}</strong><span>Publicadas</span></article><article><strong>{stats.agents}</strong><span>Agentes activos</span></article></div><div className="drg-private-notice"><h2>Escrituras bloqueadas</h2><p>Crear, editar, aprobar, rechazar, eliminar, subir archivos y gestionar formularios seguirán en producción legacy hasta desplegar y validar las reglas de seguridad nuevas.</p></div></section>;
}
