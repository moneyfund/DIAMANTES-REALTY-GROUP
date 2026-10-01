import { SiteShell } from "@/components/layout/SiteShell";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <SiteShell>
      <section className="drg-legal-page">
        <div className="drg-container drg-legal-shell">
          <article className="drg-legal-card">
            <header><p className="drg-kicker">Diamantes Realty Group</p><h1>{title}</h1><p>{intro}</p></header>
            <div className="drg-legal-sections">{children}</div>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}
