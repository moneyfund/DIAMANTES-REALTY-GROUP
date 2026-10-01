import { AgentProfileClient } from "@/components/agents/AgentProfileClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Perfil de agente | Diamantes Realty Group",
  description: "Perfil profesional de agente inmobiliario de Diamantes Realty Group.",
  robots: { index: false, follow: false }
};

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteShell><div className="drg-container"><AgentProfileClient agentId={id} /></div></SiteShell>;
}
