import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata = { title: "Condiciones de Uso | Diamantes Realty Group", robots: { index: false, follow: false } };

export default function TermsPage() {
  return <LegalPage title="Condiciones de Uso" intro="El acceso y uso de este sitio implica la aceptación de estas condiciones generales. Su propósito es establecer un marco claro para la navegación, la consulta de propiedades y la interacción con los servicios informativos y comerciales de Diamantes Realty Group.">
    <LegalSection title="Uso permitido del sitio"><p>El usuario podrá navegar, consultar propiedades, enviar solicitudes de contacto y utilizar las herramientas publicadas únicamente con fines legítimos, informativos o comerciales relacionados con operaciones inmobiliarias reales.</p></LegalSection>
    <LegalSection title="Responsabilidades del usuario"><ul><li>Brindar información veraz al completar formularios o solicitudes.</li><li>No utilizar el sitio para actividades fraudulentas, automatizadas o contrarias a la ley.</li><li>Respetar los contenidos, imágenes y descripciones publicadas sin reproducirlos indebidamente.</li></ul></LegalSection>
    <LegalSection title="Limitación de responsabilidad"><p>Diamantes Realty Group procura mantener la información actualizada y precisa, pero no garantiza la disponibilidad permanente del sitio ni la ausencia total de errores, cambios de precio, disponibilidad o modificaciones realizadas por terceros relacionados con una propiedad.</p></LegalSection>
    <LegalSection title="Modificaciones del servicio"><p>Nos reservamos el derecho de actualizar contenidos, funcionalidades, condiciones y estructura del sitio cuando resulte necesario para mejorar el servicio, cumplir requisitos operativos o responder a cambios del mercado.</p></LegalSection>
  </LegalPage>;
}
