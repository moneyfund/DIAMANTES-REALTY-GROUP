export type Property = {
  id: string;
  title: string;
  location: string;
  priceUsd: number | null;
  type: string;
  operation: string;
  coverImage: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  status: string;
  raw: Record<string, unknown>;
};
