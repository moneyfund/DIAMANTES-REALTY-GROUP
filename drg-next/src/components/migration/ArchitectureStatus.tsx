import { drgDataMode, hasFirebasePublicConfig } from "@/lib/config/env";

const checks = [
  "Next.js + React + TypeScript",
  "Tailwind CSS 4",
  "Motion preparado para UI futura",
  "Firebase modular aislado",
  "Tipos y normalización de propiedades",
  "Producción legacy sin modificaciones"
];

export function ArchitectureStatus() {
  const firebaseReady = hasFirebasePublicConfig();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">Etapa 1</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Fundación técnica de DRG 2.0</h1>
      <p className="mt-5 max-w-3xl leading-7 text-[var(--drg-muted)]">
        Esta rama crea la nueva arquitectura sin rediseñar la web pública ni tocar la producción actual.
        La conexión de datos permanece bloqueada hasta seleccionar explícitamente un entorno Firebase.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--drg-border)] bg-white p-6">
          <h2 className="text-lg font-semibold">Base creada</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--drg-muted)]">
            {checks.map((check) => <li key={check}>✓ {check}</li>)}
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--drg-border)] bg-white p-6">
          <h2 className="text-lg font-semibold">Seguridad de migración</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div><dt className="text-[var(--drg-muted)]">Modo de datos</dt><dd className="font-semibold">{drgDataMode}</dd></div>
            <div><dt className="text-[var(--drg-muted)]">Firebase configurado</dt><dd className="font-semibold">{firebaseReady ? "sí" : "no"}</dd></div>
            <div><dt className="text-[var(--drg-muted)]">Escrituras</dt><dd className="font-semibold">no implementadas en Etapa 1</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
