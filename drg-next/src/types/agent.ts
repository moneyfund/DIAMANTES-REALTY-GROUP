export type Agent = {
  id: string;
  name: string;
  role: string;
  location: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  photo: string | null;
  license: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  active: boolean;
  raw: Record<string, unknown>;
};
