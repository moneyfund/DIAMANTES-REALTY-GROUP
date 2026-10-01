import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--drg-red)]">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Ruta no encontrada</h1>
      <p className="mt-4 text-[var(--drg-muted)]">Esta ruta todavía no existe en DRG 2.0.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-[var(--drg-red)]">Volver al inicio</Link>
    </main>
  );
}
