import Link from "next/link";
import { HomeInventory } from "./HomeInventory";
import { BrandDepthScene } from "./BrandDepthScene";
import { BrandMarquee } from "./BrandMarquee";
import "./home-premium.css";

export function HomeContent() {
  return (
    <main className="drg-home-main">
      <BrandDepthScene />
      <section className="drg-signature">
        <div className="drg-container drg-signature-grid">
          <div>
            <p className="drg-kicker">Experiencia Diamantes</p>
            <h2>Bienes raíces con <em>respaldo profesional.</em></h2>
            <p>Encuentra oportunidades, recibe asesoría y avanza con un equipo que conoce el mercado inmobiliario nicaragüense.</p>
          </div>
          <nav aria-label="Accesos rápidos">
            <Link href="/propiedades"><b>Explorar</b><small>Propiedades disponibles</small></Link>
            <Link href="/agentes"><b>Asesoría</b><small>Conoce a nuestro equipo</small></Link>
            <Link href="/mapa"><b>Cobertura</b><small>Explora el mapa</small></Link>
          </nav>
        </div>
      </section>
      <BrandMarquee />
      <HomeInventory />
      <section className="drg-services drg-container">
        <p className="drg-kicker">Servicios</p>
        <h2>Soluciones inmobiliarias estratégicas</h2>
        <div className="drg-services-grid">
          <article><b>⌂</b><h3>Comprar</h3><p>Curaduría de propiedades, visitas coordinadas y acompañamiento en cada etapa de compra.</p></article>
          <article><b>◈</b><h3>Vender</h3><p>Estrategia comercial, presentación premium y gestión con compradores calificados.</p></article>
          <article><b>↗</b><h3>Invertir</h3><p>Análisis de ubicación, plusvalía y oportunidades con visión patrimonial.</p></article>
          <article><b>◎</b><h3>Avalúos</h3><p>Estimaciones profesionales para tomar decisiones con claridad y soporte de mercado.</p></article>
        </div>
      </section>
      <section className="drg-trust">
        <div className="drg-container drg-trust-grid">
          <div><p className="drg-kicker">Confianza Diamantes</p><h2>Asesoría inmobiliaria con visión, estrategia y respaldo profesional.</h2></div>
          <div><p>Diamantes Realty Group acompaña a compradores, vendedores e inversionistas con una lectura clara del mercado nicaragüense, procesos ordenados y comunicación cercana para proteger cada decisión inmobiliaria.</p><Link href="/nosotros">Conocer la correduría</Link></div>
        </div>
      </section>
    </main>
  );
}
