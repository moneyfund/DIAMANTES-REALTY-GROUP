import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/social/SocialIcon";

const socials = [
  ["Facebook", "https://www.facebook.com/profile.php?id=100092004164726"],
  ["TikTok", "https://www.tiktok.com/@diamantesrealtygroupnic"],
  ["YouTube", "https://youtube.com/@bienesraicesennicaragua"],
  ["Instagram", "https://www.instagram.com/diamantesrealtygroupnic"],
  ["WhatsApp", "https://wa.me/50577265009"]
] as const;

export function PublicFooter() {
  return (
    <footer className="drg-footer">
      <section className="drg-footer-top">
        <div className="drg-footer-container drg-footer-top-grid">
          <div className="drg-footer-brand">
            <Image src="/assets/logo.png" alt="Logo de Diamantes Realty Group" width={56} height={56} />
            <p>Lic. INVUR-UCBR-PN-N°. 0153-2026</p>
          </div>
          <div>
            <h2>Diamantes Realty Group</h2>
            <p>Inmobiliaria corporativa en Nicaragua con enfoque en propiedades premium y asesoría integral.</p>
          </div>
          <Link className="drg-footer-cta" href="/contacto">Agendar asesoría</Link>
        </div>
      </section>

      <section className="drg-footer-info">
        <div className="drg-footer-container drg-footer-info-grid">
          <nav aria-label="Enlaces legales">
            <h3>Legal</h3>
            <Link href="/politicas-de-privacidad">Políticas de Privacidad</Link>
            <Link href="/condiciones-de-uso">Condiciones de Uso</Link>
            <Link href="/licencia-de-operacion">Licencia de Operación</Link>
          </nav>
          <div>
            <h3>Contacto</h3>
            <a href="tel:+50577265009">+505 7726 5009</a>
            <a href="mailto:diamantesrealtygroup@gmail.com">diamantesrealtygroup@gmail.com</a>
            <div className="drg-footer-socials">
              {socials.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><SocialIcon network={label} size={17}/></a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="drg-footer-copy">©2026 diamantesrealtygroup.com <span>|</span> powered by <a href="https://xaron-ni.com" target="_blank" rel="noreferrer">Xarcon</a></div>
    </footer>
  );
}
