"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const primaryLinks = [
  ["/", "Inicio"],
  ["/propiedades", "Propiedades"],
  ["/mapa", "Mapa"],
  ["/quieres-vender", "¿Quieres vender?"]
] as const;

const moreLinks = [
  ["/nosotros", "Nosotros"],
  ["/agentes", "Agentes"],
  ["/educacion", "Educación"],
  ["/contacto", "Contacto"]
] as const;

export function PublicHeader({ home = false, homeScrolled = false }: { home?: boolean; homeScrolled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > (home ? 12 : 4));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, []);

  const closeNavigation = () => {
    setOpen(false);
    setMoreOpen(false);
  };

  const effectiveScrolled = scrolled || homeScrolled;
  const classes = ["drg-header", home ? "is-home" : "", effectiveScrolled ? "is-scrolled" : ""].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="drg-container drg-nav">
        <Link href="/" className="drg-brand" aria-label="Diamantes Realty Group - Inicio">
          <Image src="/assets/logo.png" alt="Logo Diamantes Realty Group" width={82} height={82} priority />
        </Link>

        <button
          className="drg-menu-toggle"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
            setMoreOpen(false);
          }}
        >
          ☰
        </button>

        <nav className={"drg-nav-links" + (open ? " is-open" : "")} aria-label="Navegación principal">
          {primaryLinks.map(([href, label]) => (
            <Link key={href} href={href} onClick={closeNavigation}>{label}</Link>
          ))}

          <div className={"drg-more-menu" + (moreOpen ? " is-open" : "")} ref={moreRef}>
            <button
              className="drg-more-trigger"
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((value) => !value)}
            >
              Ver más
              <span className="drg-more-chevron" aria-hidden="true" />
            </button>

            <div className="drg-more-dropdown" role="menu">
              {moreLinks.map(([href, label]) => (
                <Link key={href} href={href} role="menuitem" onClick={closeNavigation}>{label}</Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
