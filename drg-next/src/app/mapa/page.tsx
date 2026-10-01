import { MapExperienceClient } from "@/components/map/MapExperienceClient";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata = {
  title: "Mapa de propiedades | Diamantes Realty Group",
  description: "Explora propiedades disponibles de Diamantes Realty Group en un mapa interactivo de Nicaragua.",
  robots: { index: false, follow: false }
};

export default function MapPage() {
  return <div className="drg-map-shell"><PublicHeader/><MapExperienceClient/></div>;
}
