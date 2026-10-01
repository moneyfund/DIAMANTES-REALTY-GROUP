import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata = { title: "Licencia de Operación | Diamantes Realty Group", robots: { index: false, follow: false } };

export default function LicensePage() {
  return <LegalPage title="Licencia de Operación" intro="Esta sección centraliza la información institucional y regulatoria vinculada con la operación de la correduría, ofreciendo un punto de consulta ordenado y transparente para clientes, propietarios e inversionistas.">
    <LegalSection title="Documentación oficial"><p>Aquí se publicarán los documentos legales oficiales de la correduría, incluyendo certificados, licencias, permisos, constancias, archivos PDF e imágenes escaneadas que correspondan.</p></LegalSection>
    <div className="drg-legal-doc-grid"><article><span>PDF</span><p>Espacio preparado para certificados, licencias o permisos en formato PDF.</p></article><article><span>Imagen</span><p>Espacio preparado para documentos escaneados, sellos oficiales o evidencias visuales.</p></article></div>
  </LegalPage>;
}
