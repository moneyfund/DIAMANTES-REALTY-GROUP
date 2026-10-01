import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--drg-border)] bg-white">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center gap-4 px-6">
        <Image src="/assets/logo.png" alt="Diamantes Realty Group" width={58} height={58} priority />
        <div>
          <p className="m-0 text-sm font-semibold">Diamantes Realty Group</p>
          <p className="m-0 text-xs text-[var(--drg-muted)]">DRG 2.0 · entorno de migración</p>
        </div>
      </div>
    </header>
  );
}
