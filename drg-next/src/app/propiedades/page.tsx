import { PropertyCatalogClient } from "@/components/properties/PropertyCatalogClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Propiedades · DRG 2.0 Migration Preview",
  robots: { index: false, follow: false }
};

export default function PropertiesPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">Migración funcional</p>
        <h1 className="text-4xl font-semibold tracking-tight">Inventario público</h1>
        <p className="mt-4 max-w-3xl text-[var(--drg-muted)]">
          Esta vista existe para validar compatibilidad de datos antes de portar el diseño del catálogo.
        </p>
        <div className="mt-10">
          <PropertyCatalogClient />
        </div>
      </section>
    </SiteShell>
  );
}
