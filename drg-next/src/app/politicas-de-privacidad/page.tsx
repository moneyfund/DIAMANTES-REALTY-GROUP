import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata = { title: "Políticas de Privacidad | Diamantes Realty Group", robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <LegalPage title="Políticas de Privacidad" intro="En Diamantes Realty Group valoramos la confidencialidad de la información personal compartida por clientes, propietarios, inversionistas y visitantes del sitio. Esta política describe de forma clara cómo tratamos los datos que recibimos a través de formularios, consultas y herramientas digitales de contacto.">
    <LegalSection title="Recolección de datos"><p>Podemos recopilar datos de identificación y contacto como nombre, correo electrónico, número telefónico, ubicación de interés y cualquier información que el usuario decida incluir en formularios de consulta, solicitudes de asesoría o procesos comerciales.</p></LegalSection>
    <LegalSection title="Uso de la información"><p>La información se utiliza para responder consultas, brindar asesoría inmobiliaria, coordinar visitas, presentar oportunidades acordes al perfil del usuario y mejorar la experiencia general dentro del sitio web y nuestros canales de atención.</p></LegalSection>
    <LegalSection title="Protección de datos"><p>Aplicamos medidas razonables de seguridad administrativa y tecnológica para proteger la información contra accesos no autorizados, alteraciones indebidas, pérdida o divulgación accidental, conforme a buenas prácticas operativas.</p></LegalSection>
    <LegalSection title="Cookies"><p>Este sitio puede utilizar cookies o tecnologías similares para recordar preferencias, facilitar la navegación, analizar el comportamiento general de uso y optimizar funcionalidades. El usuario puede gestionar estas preferencias desde la configuración de su navegador.</p></LegalSection>
    <LegalSection title="Contacto"><p>Para consultas relacionadas con privacidad, actualización de datos o solicitudes sobre el tratamiento de la información, puedes comunicarte con nuestro equipo a través de la página de contacto oficial del sitio.</p></LegalSection>
  </LegalPage>;
}
