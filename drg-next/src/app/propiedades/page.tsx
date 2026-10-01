import { PropertyCatalogClient } from "@/components/properties/PropertyCatalogClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Propiedades en Nicaragua | Diamantes Realty Group",
  description: "Explora propiedades disponibles en Nicaragua con Diamantes Realty Group.",
  robots: { index: false, follow: false }
};

export default function PropertiesPage() {
  return <SiteShell><div className="drg-container"><PropertyCatalogClient /></div></SiteShell>;
}
