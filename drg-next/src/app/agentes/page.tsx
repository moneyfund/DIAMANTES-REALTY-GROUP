import { AgentsDirectoryClient } from "@/components/agents/AgentsDirectoryClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Agentes | Diamantes Realty Group",
  description: "Conoce al equipo de agentes inmobiliarios de Diamantes Realty Group.",
  robots: { index: false, follow: false }
};

export default function AgentsPage() {
  return (
    <SiteShell>
      <section className="drg-agents-page">
        <div className="drg-container">
          <header className="drg-agents-heading">
            <div><p className="drg-kicker">Equipo Diamantes</p><h1>Nuestros agentes</h1></div>
            <p>Profesionales preparados para acompañarte en la compra, venta e inversión inmobiliaria.</p>
          </header>
          <AgentsDirectoryClient />
        </div>
      </section>
    </SiteShell>
  );
}
