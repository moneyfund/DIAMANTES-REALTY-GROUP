"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Building2, MapPin, Search } from "lucide-react";

const slides = [
  { src: "/assets/imagenhero1.jpeg" },
  { src: "/assets/imagenhero2.jpeg" },
  { src: "/assets/imagenhero3.jpeg" },
  { src: "/assets/imagenhero4.jpeg" },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/56/Esteli_Nicaragua_Skyline_from_Tisey_4.jpg",
    city: "Estelí",
    credit: "Tisey · CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Esteli_Nicaragua_Skyline_from_Tisey_4.jpg"
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/df/Matagalpa_Feb_2010.jpg",
    city: "Matagalpa",
    credit: "Armando Gonzalez Sr. · CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Matagalpa_Feb_2010.jpg"
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Nicaragua_-_Managua_201308_-_panoramio.jpg",
    city: "Managua",
    credit: "randreu · CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Nicaragua_-_Managua_201308_-_panoramio.jpg"
  }
];
const departments = ["Boaco","Carazo","Chinandega","Chontales","Estelí","Granada","Jinotega","León","Madriz","Managua","Masaya","Matagalpa","Nueva Segovia","Rivas","Río San Juan"];

export function OriginalHero() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [operation, setOperation] = useState("venta");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((value) => (value + 1) % slides.length), 3000);
    return () => window.clearInterval(id);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const location = String(data.get("ubicacion") || "");
    const type = String(data.get("tipo") || "");
    if (location) params.set("ubicacion", location);
    if (type) params.set("tipo", type);
    if (operation) params.set("operacion", operation);
    setMobileOpen(false);
    router.push("/propiedades?" + params.toString());
  }

  const searchForm = (
    <form className="drg-hero-search" onSubmit={submit}>
      <div className="drg-operation-tabs">
        <button type="button" className={operation === "venta" ? "is-active" : ""} onClick={() => setOperation("venta")}>Venta</button>
        <button type="button" className={operation === "alquiler" ? "is-active" : ""} onClick={() => setOperation("alquiler")}>Alquiler</button>
      </div>
      <label className="drg-search-field">
        <Building2 aria-hidden="true" />
        <span>Tipo de propiedad</span>
        <select name="tipo" defaultValue="">
          <option value="">Tipo de propiedad</option>
          <option value="house">Casa</option><option value="apartment">Apartamento</option><option value="land">Terreno</option>
          <option value="warehouse">Bodega</option><option value="farm">Finca</option><option value="quinta">Quinta</option><option value="beach_house">Casa de playa</option>
        </select>
      </label>
      <label className="drg-search-field">
        <MapPin aria-hidden="true" />
        <span>Departamento</span>
        <select name="ubicacion" defaultValue="">
          <option value="">Todos los departamentos</option>
          {departments.map((department) => <option key={department}>{department}</option>)}
        </select>
      </label>
      <label className="drg-search-field">
        <BadgeDollarSign aria-hidden="true" />
        <span>Rango de precio</span>
        <select name="precio" defaultValue="">
          <option value="">Rango de precio</option>
          <option value="0-100000">Hasta $100K</option>
          <option value="100000-300000">$100K - $300K</option>
          <option value="300000-700000">$300K - $700K</option>
          <option value="700000+">$700K+</option>
        </select>
      </label>
      <button className="drg-search-submit" type="submit"><Search size={16} aria-hidden="true" /><span>BUSCAR</span></button>
    </form>
  );

  return (
    <section className="drg-hero">
      <div className="drg-hero-slider" aria-hidden="true">
        {slides.map((item, index) => (
          <figure key={item.src} className={index === slide ? "is-active" : ""}>
            <Image
              src={item.src}
              alt={item.city ? "Vista de " + item.city + ", Nicaragua" : ""}
              fill
              priority={index === 0}
              sizes="100vw"
            />
          </figure>
        ))}
      </div>
      <div className="drg-hero-overlay" />
      {slides[slide].credit && slides[slide].source ? (
        <a className="drg-hero-photo-credit" href={slides[slide].source} target="_blank" rel="noreferrer">
          <span>{slides[slide].city}</span> · Foto: {slides[slide].credit}
        </a>
      ) : null}
      <div className="drg-container drg-hero-content">
        <div className="drg-hero-copy">
          <p className="drg-eyebrow">Diamantes Realty Group</p>
          <p className="drg-license">INVUR-UCBR-PN-N°. 0153-2026</p>
          <h1>Encuentra la propiedad ideal en Nicaragua</h1>
          <div className="drg-hero-actions">
            <a className="drg-btn drg-btn-red" href="/propiedades">Explorar propiedades</a>
            <a className="drg-btn drg-btn-ghost" href="https://wa.me/50577265009?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor%20inmobiliario." target="_blank" rel="noreferrer">Hablar con un asesor</a>
          </div>
          <button className="drg-mobile-search-trigger" type="button" onClick={() => setMobileOpen(true)}>⌕ <span>Buscar propiedades</span></button>
        </div>
        <div className="drg-hero-search-wrap">{searchForm}</div>
      </div>

      {mobileOpen ? (
        <div className="drg-mobile-search-layer" role="dialog" aria-modal="true">
          <button className="drg-mobile-backdrop" aria-label="Cerrar" onClick={() => setMobileOpen(false)} />
          <div className="drg-mobile-sheet">
            <div className="drg-mobile-sheet-head"><h2>Buscar propiedades</h2><button type="button" onClick={() => setMobileOpen(false)}>×</button></div>
            {searchForm}
          </div>
        </div>
      ) : null}
    </section>
  );
}
