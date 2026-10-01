import { SiteShell } from "@/components/layout/SiteShell";

export function RoutePlaceholder({
  title,
  legacyPath
}: {
  title: string;
  legacyPath: string;
}) {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">Ruta reservada</p>
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--drg-muted)]">
          La ruta ya existe en la nueva arquitectura. Su funcionalidad y diseño se migrarán desde
          <code className="mx-1 rounded bg-white px-2 py-1 text-xs">{legacyPath}</code>
          en una etapa posterior, sin afectar producción.
        </p>
      </section>
    </SiteShell>
  );
}
