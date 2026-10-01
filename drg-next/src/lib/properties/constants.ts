export const USD_TO_NIO_RATE = 36.6243;

export const PROPERTY_TYPE_ALIASES: Record<string, string[]> = {
  house: ["house", "casa", "casas"],
  apartment: ["apartment", "apartamento", "apartamentos"],
  quinta: ["quinta", "quintas"],
  farm: ["farm", "finca", "fincas"],
  land: ["land", "terreno", "terrenos"],
  commercial: ["commercial", "local", "local comercial", "local_comercial", "retail"],
  warehouse: ["warehouse", "bodega", "bodegas"],
  office: ["office", "oficina", "oficinas"],
  investment: ["investment", "project", "proyecto", "proyecto / inversión", "proyecto inversion", "proyecto_inversion", "inversion"],
  other: ["other", "otro", "otra"],
  beach_house: ["beach_house", "beach-house", "beach house", "casa cerca del mar", "casas cerca del mar", "casa_cerca_del_mar"]
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "Casa",
  apartment: "Apartamento",
  quinta: "Quinta",
  farm: "Finca",
  land: "Terreno",
  commercial: "Local comercial",
  warehouse: "Bodega",
  office: "Oficina",
  investment: "Proyecto / inversión",
  other: "Otro",
  beach_house: "Casa cerca del mar"
};

export const PUBLIC_PROPERTIES_COLLECTION = "properties";
