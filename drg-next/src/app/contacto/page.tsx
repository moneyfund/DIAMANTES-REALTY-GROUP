import { ContactFormClient } from "@/components/forms/ContactFormClient";
import { SiteShell } from "@/components/layout/SiteShell";
import { SocialIcon } from "@/components/social/SocialIcon";

export const metadata = {
  title: "Contacto | Diamantes Realty Group",
  description: "Habla con Diamantes Realty Group y recibe asesoría inmobiliaria profesional en Nicaragua.",
  robots: { index: false, follow: false }
};

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="drg-public-banner"><div className="drg-container"><p className="drg-kicker">Contacto</p><h1>Hablemos de tu próxima propiedad</h1><p>Recibe asesoría personalizada de nuestro equipo.</p></div></section>
      <section className="drg-container drg-contact-section">
        <div className="drg-contact-copy"><h2>Cuéntanos qué necesitas</h2><p>Comprar, vender, alquilar o invertir: comparte tu objetivo y nuestro equipo podrá orientarte hacia el siguiente paso.</p><a href="https://wa.me/50577265009" target="_blank" rel="noreferrer"><SocialIcon network="WhatsApp" size={17}/> WhatsApp · +505 7726 5009</a><a href="mailto:diamantesrealtygroup@gmail.com">diamantesrealtygroup@gmail.com</a></div>
        <ContactFormClient />
      </section>
    </SiteShell>
  );
}
