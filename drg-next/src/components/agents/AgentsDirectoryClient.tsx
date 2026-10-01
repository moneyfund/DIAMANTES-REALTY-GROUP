"use client";

import { useEffect, useState } from "react";
import { readAgents } from "@/lib/firebase/agents";
import type { Agent } from "@/types/agent";
import { AgentCard } from "./AgentCard";

export function AgentsDirectoryClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    readAgents()
      .then((items) => { setAgents(items); setStatus("ready"); })
      .catch((error) => { console.error(error); setStatus("error"); });
  }, []);

  if (status === "loading") return <div className="drg-agent-status">Cargando agentes…</div>;
  if (status === "error") return <div className="drg-agent-status">No fue posible cargar los agentes en este momento.</div>;
  if (!agents.length) return <div className="drg-agent-status">Nuestro directorio de agentes se está actualizando.</div>;

  return <div className="drg-agents-grid">{agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div>;
}
