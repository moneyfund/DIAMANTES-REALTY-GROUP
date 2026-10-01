export type Property = {
  id: string;
  title: string;
  location: string;
  priceUsd: number | null;
  type: string;
  typeLabel: string;
  operation: string;
  coverImage: string | null;
  images: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  areaUnit: string;
  status: string;
  description: string;
  publicVisible: boolean;
  raw: Record<string, unknown>;
};
