import { EducationCenterClient } from "@/components/education/EducationCenterClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Educación Inmobiliaria en Nicaragua | Diamantes Realty Group",
  description: "Aprende a comprar, vender e invertir en propiedades en Nicaragua con guías, conceptos, procesos y orientación inmobiliaria profesional.",
  robots: { index: false, follow: false }
};

export default function EducationPage() {
  return (
    <SiteShell>
      <section className="drg-edu-hero"><div className="drg-container drg-edu-hero-grid"><div><p className="drg-kicker">Centro de educación inmobiliaria</p><h1>Conocimiento para tomar mejores decisiones inmobiliarias</h1><p>Aprende a comprar, vender e invertir en bienes raíces en Nicaragua con mayor claridad, seguridad y respaldo profesional.</p><div><a href="#rutas">Comenzar a aprender</a><a href="https://wa.me/50577265009" target="_blank" rel="noreferrer">Solicitar asesoría</a></div></div><aside><p>Tu ruta hacia una decisión informada</p><ol><li><span>01</span>Explora tu objetivo</li><li><span>02</span>Comprende el proceso</li><li><span>03</span>Decide con respaldo</li></ol></aside></div></section>
      <EducationCenterClient />
    </SiteShell>
  );
}
