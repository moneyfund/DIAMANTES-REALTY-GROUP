"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readAgentById } from "@/lib/firebase/agents";
import { readProperties } from "@/lib/firebase/properties";
import { agentCoverageDepartments, getAgentInitials, normalizeExternalUrl, propertiesForAgent } from "@/lib/agents/utils";
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { SocialIcon } from "@/components/social/SocialIcon";

export function AgentProfileClient({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    Promise.all([readAgentById(agentId), readProperties(200)])
      .then(([nextAgent, propertyResult]) => {
        if (cancelled) return;
        if (!nextAgent) { setStatus("missing"); return; }
        setAgent(nextAgent);
        setProperties(propertiesForAgent(propertyResult.properties, agentId));
        setStatus("ready");
      })
      .catch((error) => { console.error(error); if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [agentId]);

  const departments = useMemo(() => agent ? agentCoverageDepartments(agent, properties) : [], [agent, properties]);

  if (status === "loading") return <div className="drg-agent-profile-status">Preparando el perfil profesional del agente…</div>;
  if (status === "missing") return <div className="drg-agent-profile-status"><h1>Agente no encontrado</h1><Link href="/agentes">Ver agentes</Link></div>;
  if (status === "error" || !agent) return <div className="drg-agent-profile-status">No fue posible cargar este perfil.</div>;

  const whatsapp = normalizeExternalUrl(agent.whatsapp || agent.phone, "whatsapp");
  const socials = [
    ["Instagram", normalizeExternalUrl(agent.instagram)],
    ["Facebook", normalizeExternalUrl(agent.facebook)],
    ["TikTok", normalizeExternalUrl(agent.tiktok)],
    ["WhatsApp", whatsapp]
  ].filter((item) => item[1]);

  return (
    <div className="drg-agent-profile-page">
      <article className="drg-agent-profile">
        <div className="drg-agent-profile-photo">
          {agent.photo ? <Image src={agent.photo} alt={agent.name} fill sizes="320px" /> : <div>{getAgentInitials(agent.name)}</div>}
          <span>Diamantes Realty Group</span>
        </div>

        <div className="drg-agent-profile-main">
          <p className="drg-kicker">Perfil profesional</p>
          <h1>{agent.name}</h1>
          <p className="drg-agent-profile-role">{agent.role} · {agent.location}</p>
          {agent.license ? <p className="drg-agent-license"><span>Carnet profesional</span><strong>{agent.license}</strong></p> : null}
          <p className="drg-agent-profile-description">{agent.description || "Este agente forma parte del equipo profesional de Diamantes Realty Group y está disponible para asesorarte en oportunidades inmobiliarias con un acompañamiento claro y cercano."}</p>

          <div className="drg-agent-profile-contact">
            {agent.phone ? <a href={"tel:" + agent.phone.replace(/\s+/g, "")}><span>Teléfono</span><strong><Phone size={14} /> {agent.phone}</strong></a> : null}
            {agent.email ? <a href={"mailto:" + agent.email}><span>Correo</span><strong><Mail size={14} /> {agent.email}</strong></a> : null}
          </div>

          {socials.length ? <div className="drg-agent-profile-socials">{socials.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer"><SocialIcon network={label} size={15}/><span>{label}</span></a>)}</div> : null}
          <div className="drg-agent-profile-actions">{whatsapp ? <a className="is-primary" href={whatsapp} target="_blank" rel="noreferrer">Hablar por WhatsApp</a> : null}<a href="#agentProperties">Ver propiedades</a></div>
        </div>

        <aside className="drg-agent-insights">
          <p>Perfil en cifras</p>
          <div><strong>{properties.length}</strong><span>Propiedades publicadas</span></div>
          <div><strong>{departments.length}</strong><span>Departamentos en su inventario o cobertura</span></div>
          <div className="is-location"><strong>{agent.location}</strong><span>Base / zona de atención</span></div>
          <small>Solicita información, coordina una visita o conversa directamente con este agente.</small>
        </aside>
      </article>

      <section className="drg-agent-about">
        <p className="drg-kicker">Trayectoria</p><h2>Sobre el agente</h2>
        <p>{agent.description || "Perfil profesional de Diamantes Realty Group."}</p>
      </section>

      <section id="agentProperties" className="drg-agent-properties">
        <header><div><p className="drg-kicker">Inventario</p><h2>Propiedades de {agent.name}</h2></div><p>Explora las oportunidades publicadas por este agente.</p></header>
        {properties.length ? <div className="drg-properties-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="drg-agent-status">Este agente aún no tiene propiedades publicadas.</div>}
      </section>
    </div>
  );
}
