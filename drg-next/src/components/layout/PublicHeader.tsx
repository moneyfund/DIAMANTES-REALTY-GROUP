"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["/", "Inicio"],
  ["/propiedades", "Propiedades"],
  ["/mapa", "Mapa"],
  ["/nosotros", "Nosotros"],
  ["/agentes", "Agentes"],
  ["/educacion", "Educación"],
  ["/quieres-vender", "¿Quieres vender?"],
  ["/contacto", "Contacto"]
] as const;

export function PublicHeader({ home = false }: { home?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > (home ? 12 : 4));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);

  const classes = ["drg-header", home ? "is-home" : "", scrolled ? "is-scrolled" : ""].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="drg-container drg-nav">
        <Link href="/" className="drg-brand" aria-label="Diamantes Realty Group - Inicio">
          <Image src="/assets/logo.png" alt="Logo Diamantes Realty Group" width={72} height={72} priority />
        </Link>
        <button className="drg-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen((value) => !value)}>☰</button>
        <nav className={"drg-nav-links" + (open ? " is-open" : "")} aria-label="Navegación principal">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
