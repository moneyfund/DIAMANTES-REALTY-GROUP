import { SiteShell } from "@/components/layout/SiteShell";

export default async function PropertyDetailMigrationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">Compatibilidad de ruta</p>
        <h1 className="text-4xl font-semibold tracking-tight">Ficha de propiedad</h1>
        <p className="mt-4 text-[var(--drg-muted)]">
          ID recibido: <code className="rounded bg-white px-2 py-1 text-xs">{id}</code>
        </p>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--drg-muted)]">
          La ruta dinámica ya está preparada. La galería, ficha, agente, mapa y reseñas se migrarán después
          de validar primero la lectura pública del inventario.
        </p>
      </section>
    </SiteShell>
  );
}
