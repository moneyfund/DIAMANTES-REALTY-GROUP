import { ArrowUpRight, History, Home, MapPinned, ShieldCheck } from "lucide-react";

const AVALNIC_URL = "https://avaluos-platform.vercel.app";
const TENANT_ID = "marvin-valdivia";

const moduleLinks = [
  {
    title: "Avalúo de terreno",
    description: "Valora suelo, ubicación, topografía, accesos, servicios y potencial de desarrollo.",
    href: `${AVALNIC_URL}/avaluos/terrenos?tenant=${TENANT_ID}`,
    icon: MapPinned,
  },
  {
    title: "Avalúo de casa",
    description: "Evalúa terreno, construcción, estado, acabados y características de la vivienda.",
    href: `${AVALNIC_URL}/avaluos/casas?tenant=${TENANT_ID}`,
    icon: Home,
  },
  {
    title: "Historial",
    description: "Consulta los expedientes y avalúos guardados dentro de la organización DRG.",
    href: `${AVALNIC_URL}/historial?tenant=${TENANT_ID}`,
    icon: History,
  },
] as const;

export function AvaluosPlaceholder(){
  return <section className="drg-avalnic-portal">
    <div className="drg-avalnic-hero">
      <div className="drg-avalnic-brand">
        <img src={`${AVALNIC_URL}/avalnic-logo.svg`} alt="AVALNIC"/>
        <span>Professional Valuation Suite</span>
      </div>
      <div className="drg-avalnic-copy">
        <p className="drg-avalnic-kicker"><ShieldCheck size={15}/> Organización conectada</p>
        <h2>Diamantes Realty Group × AVALNIC</h2>
        <p>Tu espacio profesional de avalúos está conectado a la organización <strong>Diamantes Realty Group</strong>. Los cálculos, expedientes, historial y PDFs se gestionan directamente desde AVALNIC con las funciones predeterminadas de la plataforma.</p>
      </div>
      <a className="drg-avalnic-primary" href={`${AVALNIC_URL}/avaluos?tenant=${TENANT_ID}`} target="_blank" rel="noreferrer">
        Abrir AVALNIC <ArrowUpRight size={17}/>
      </a>
    </div>

    <div className="drg-avalnic-modules">
      {moduleLinks.map(({title,description,href,icon:Icon})=><a key={title} href={href} target="_blank" rel="noreferrer">
        <span className="drg-avalnic-module-icon"><Icon size={21}/></span>
        <span className="drg-avalnic-module-copy"><strong>{title}</strong><small>{description}</small></span>
        <ArrowUpRight className="drg-avalnic-module-arrow" size={16}/>
      </a>)}
    </div>

    <div className="drg-avalnic-note">
      <span>AVALNIC</span>
      <p>El acceso y los permisos se validan dentro de AVALNIC para la organización Diamantes Realty Group. La primera vez puede solicitar iniciar sesión con la cuenta de Google autorizada.</p>
    </div>
  </section>;
}
