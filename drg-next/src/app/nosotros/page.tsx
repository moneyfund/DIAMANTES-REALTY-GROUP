import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Nosotros | Diamantes Realty Group",
  description: "Conoce la visión, valores y enfoque profesional de Diamantes Realty Group en Nicaragua.",
  robots: { index: false, follow: false }
};

const values = [
  ["Integridad Profesional", "Actuamos con ética, transparencia y responsabilidad en cada operación inmobiliaria, protegiendo siempre los intereses de nuestros clientes."],
  ["Excelencia en el Servicio", "Brindamos una atención personalizada, ágil y profesional, enfocada en superar las expectativas de compradores, vendedores e inversionistas."],
  ["Conocimiento del Mercado", "Tomamos decisiones respaldadas por análisis, experiencia y conocimiento profundo del mercado inmobiliario nicaragüense."],
  ["Compromiso con los Resultados", "Trabajamos con determinación para alcanzar los objetivos de nuestros clientes y generar transacciones exitosas y sostenibles."],
  ["Innovación y Tecnología", "Incorporamos herramientas digitales, estrategias modernas y soluciones tecnológicas para optimizar cada proceso inmobiliario."],
  ["Relaciones de Largo Plazo", "Creemos en construir vínculos sólidos basados en confianza, credibilidad y acompañamiento continuo más allá de una simple transacción."]
] as const;

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="drg-container drg-about-story drg-about-story-direct">
        <div className="drg-about-copy">
          <p className="drg-kicker">Diamantes Realty Group</p>
          <h1 className="drg-about-direct-title">Excelencia en bienes raíces</h1>
          <p className="drg-about-direct-lead">Somos una firma inmobiliaria nicaragüense enfocada en acompañar decisiones patrimoniales con conocimiento del mercado, comunicación clara y una ejecución profesional de principio a fin.</p>
          <p>DIAMANTES REALTY GROUP es una firma inmobiliaria nicaragüense especializada en la comercialización, promoción y asesoría estratégica de bienes raíces. Nuestro compromiso es conectar a compradores, vendedores e inversionistas con oportunidades inmobiliarias de alto valor, brindando un servicio profesional basado en la transparencia, el conocimiento del mercado y la atención personalizada.</p>
          <p>Contamos con una red de agentes y aliados estratégicos que nos permite ofrecer cobertura en las principales ciudades y regiones de Nicaragua, incluyendo Matagalpa, Estelí, Managua, Granada, León, Chinandega, Boaco, Jinotega, Nueva Segovia y Rivas. Esta presencia nos permite identificar oportunidades tanto en mercados urbanos como rurales, atendiendo propiedades residenciales, comerciales, industriales, turísticas, agrícolas y de inversión.</p>
          <p>En DIAMANTES REALTY GROUP entendemos que cada propiedad representa una decisión importante. Por ello acompañamos a nuestros clientes durante todo el proceso, desde la valoración inicial y promoción del inmueble hasta la negociación y cierre de la operación.</p>
          <p>Trabajamos con propietarios que desean maximizar el valor de sus activos, con compradores que buscan seguridad en sus inversiones y con inversionistas interesados en identificar oportunidades con potencial de crecimiento en las distintas regiones del país.</p>
          <p>Más que una correduría, somos un aliado estratégico para quienes buscan vender, comprar o invertir en bienes raíces con el respaldo de un equipo comprometido con la excelencia, la integridad y el servicio profesional.</p>
        </div>
        <aside className="drg-about-values">
          <p className="drg-kicker">Principios de trabajo</p><h3>Nuestros valores</h3>
          <ul>{values.map(([title, text]) => <li key={title}><strong>{title}:</strong> {text}</li>)}</ul>
        </aside>
      </section>
    </SiteShell>
  );
}
