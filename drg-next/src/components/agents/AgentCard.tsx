import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { getAgentInitials, normalizeExternalUrl } from "@/lib/agents/utils";
import type { Agent } from "@/types/agent";

export function AgentCard({ agent }: { agent: Agent }) {
  const socials = [
    ["Instagram", normalizeExternalUrl(agent.instagram)],
    ["Facebook", normalizeExternalUrl(agent.facebook)],
    ["TikTok", normalizeExternalUrl(agent.tiktok)],
    ["WhatsApp", normalizeExternalUrl(agent.whatsapp || agent.phone, "whatsapp")]
  ].filter((item) => item[1]);

  return (
    <article className="drg-agent-card">
      <div className="drg-agent-media">
        {agent.photo ? (
          <Image src={agent.photo} alt={agent.name} fill sizes="(max-width:720px) 100vw, (max-width:1080px) 50vw, 33vw" />
        ) : (
          <div className="drg-agent-initials">{getAgentInitials(agent.name)}</div>
        )}
        <span>{agent.role}</span>
      </div>
      <div className="drg-agent-body">
        <h2>{agent.name}</h2>
        <p className="drg-agent-location">{agent.location || "Diamantes Realty Group · Nicaragua"}</p>
        <p className="drg-agent-description">{agent.description || "Asesoría inmobiliaria profesional para comprar, vender o invertir con mayor claridad."}</p>
        <div className="drg-agent-contact">
          {agent.phone ? <a href={"tel:" + agent.phone.replace(/\s+/g, "")}><Phone size={16} /> {agent.phone}</a> : null}
          {agent.email ? <a href={"mailto:" + agent.email}><Mail size={16} /> {agent.email}</a> : null}
        </div>
        {socials.length ? <div className="drg-agent-socials">{socials.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>{label.slice(0, 2)}</a>)}</div> : null}
        <div className="drg-agent-actions">
          <Link className="is-primary" href={"/propiedades?agent=" + encodeURIComponent(agent.id)}>Ver propiedades</Link>
          <Link href={"/agente/" + agent.id}>Perfil profesional</Link>
        </div>
      </div>
    </article>
  );
}
