import { SellerFormClient } from "@/components/forms/SellerFormClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Vende tu propiedad | Diamantes Realty Group",
  description: "Envía la información de tu propiedad a Diamantes Realty Group o contacta directamente a uno de nuestros asesores.",
  robots: { index: false, follow: false }
};

export default function SellerPage() {
  return <SiteShell><section className="drg-seller-page"><div className="drg-container"><SellerFormClient /></div></section></SiteShell>;
}
