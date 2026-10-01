export function ArchitectureStatus() {
  const checks = [
    "Next.js + React + TypeScript",
    "Catálogo público conectado en modo read-only",
    "Ficha de propiedad migrada",
    "Mapa público con Leaflet",
    "Agentes y perfiles migrados",
    "Educación interactiva migrada",
    "Páginas comerciales y legales migradas",
    "Producción legacy sin modificaciones"
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">Migración pública</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">DRG 2.0 · fase pública read-only</h1>
      <p className="mt-5 max-w-3xl leading-7 text-[var(--drg-muted)]">
        La nueva aplicación ya cubre la experiencia pública principal y valida sus datos reales sin activar escrituras.
        Los flujos privados y administrativos permanecen en la aplicación legacy hasta la siguiente fase de seguridad.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--drg-border)] bg-white p-6">
          <h2 className="text-lg font-semibold">Cobertura completada</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--drg-muted)]">
            {checks.map((check) => <li key={check}>✓ {check}</li>)}
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--drg-border)] bg-white p-6">
          <h2 className="text-lg font-semibold">Límite deliberado</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--drg-muted)]">
            Formularios, autenticación, Storage y CRUD privado se mantienen sin migrar para evitar mezclar una
            modernización visual con cambios de permisos y escritura sobre producción.
          </p>
        </article>
      </div>
    </section>
  );
}
