import Image from "next/image";
import Link from "next/link";
import { publicRoutes } from "@/lib/routes";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--drg-border)] bg-white">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center gap-5 px-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/assets/logo.png" alt="Diamantes Realty Group" width={58} height={58} priority />
          <div>
            <p className="m-0 text-sm font-semibold">Diamantes Realty Group</p>
            <p className="m-0 text-xs text-[var(--drg-muted)]">DRG 2.0 · migración</p>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-4 text-xs lg:flex" aria-label="Navegación principal">
          {publicRoutes.map((route) => (
            <Link key={route.href} href={route.href} className="text-[var(--drg-muted)] no-underline hover:text-[var(--drg-ink)]">
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
