"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { readProperties } from "@/lib/firebase/properties";
import { getPublishingAgentId } from "@/lib/properties/detail";
import type { Property } from "@/types/property";

export function AgentReadOnlyDashboard() {
  const { profile, logout } = useDrgAuth();
  const [properties,setProperties]=useState<Property[]>([]);
  useEffect(()=>{readProperties(200).then(result=>setProperties(result.properties)).catch(console.error)},[]);
  const own=useMemo(()=>properties.filter(property=>{
    const uid=profile.user?.uid||"";
    const email=String(profile.user?.email||"").toLowerCase();
    const raw=property.raw;
    const idMatches=[getPublishingAgentId(property),raw.agenteId,raw.ownerId,raw.userId,raw.createdBy].some(value=>String(value||"")===uid);
    const emailMatches=[raw.agentEmail,raw.email,raw.createdByEmail,raw.ownerEmail,raw.createdBy].some(value=>String(value||"").toLowerCase()===email);
    return idMatches || Boolean(email&&emailMatches);
  }),[properties,profile.user]);
  return <section className="drg-private-dashboard"><header><div><p className="drg-kicker">Acceso privado</p><h1>Panel de agente</h1><p>{profile.agent?.name || profile.user?.displayName || "Agente DRG"}</p></div><div><span>{profile.user?.email}</span><button onClick={()=>void logout()}>Cerrar sesión</button></div></header><div className="drg-private-stats"><article><strong>{own.length}</strong><span>Propiedades detectadas</span></article><article><strong>{own.filter(p=>p.publicVisible).length}</strong><span>Publicadas</span></article><article><strong>{own.filter(p=>String(p.raw.publicationStatus||"")==="pending_review").length}</strong><span>Pendientes</span></article></div><div className="drg-private-notice"><h2>Fase de seguridad</h2><p>Tu inventario ya puede identificarse desde la arquitectura nueva, pero edición, subida de imágenes y envío a revisión permanecen bloqueados hasta probar reglas y Storage.</p><Link href="/agentes">Ver perfil público</Link></div></section>;
}
