import { PropertyDetailClient } from "@/components/properties/PropertyDetailClient";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "Propiedad | Diamantes Realty Group",
  description: "Ficha de propiedad de Diamantes Realty Group.",
  robots: { index: false, follow: false }
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteShell><div className="drg-container drg-detail-route"><PropertyDetailClient propertyId={id} /></div></SiteShell>;
}
