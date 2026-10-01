import type { User } from "firebase/auth";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { getPublishingAgentId } from "./detail";
import { normalizePropertyType } from "./compat";

export type PropertyDetails = Record<string, string | number>;

export type AgentPropertyDraft = {
  title: string;
  priceUsd: number;
  location: string;
  department: string;
  description: string;
  type: string;
  operation: string;
  status: string;
  visibility: "public" | "agents" | "private";
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  areaUnit: string;
  details: PropertyDetails;
  highlightedTags: string[];
  lat: number | null;
  lng: number | null;
  contractStartDate: string;
  contractEndDate: string;
  videoType: "" | "youtube" | "tiktok";
  videoUrl: string;
  images: string[];
  coverImage: string;
};

function norm(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function ownsPropertyForUser(property: Property, user: Pick<User,"uid"|"email"|"displayName">, agent?: Agent | null) {
  const raw = property.raw;
  const uid = String(user.uid || "");
  const email = norm(user.email);
  const ids = [getPublishingAgentId(property), raw.agenteId, raw.ownerId, raw.userId, raw.createdBy].map(String);
  if (uid && ids.includes(uid)) return true;

  const emails = [raw.agentEmail,raw.email,raw.createdByEmail,raw.ownerEmail,raw.createdBy].map(norm);
  if (email && emails.includes(email)) return true;

  const names = [raw.agentName,raw.agente,raw.agent].map(norm);
  const profileName = norm(agent?.name || user.displayName);
  return Boolean(profileName && names.includes(profileName));
}

export function propertyToDraft(property: Property): AgentPropertyDraft {
  const raw = property.raw;
  const details = raw.propertyDetails && typeof raw.propertyDetails === "object"
    ? { ...(raw.propertyDetails as PropertyDetails) }
    : {};
  const tags = Array.isArray(raw.highlightedTags) ? raw.highlightedTags : Array.isArray(raw.tags) ? raw.tags : [];
  const video = raw.video && typeof raw.video === "object" ? raw.video as Record<string,unknown> : {};
  return {
    title: property.title,
    priceUsd: property.priceUsd || 0,
    location: property.location,
    department: String(raw.department || raw.city || ""),
    description: property.description,
    type: normalizePropertyType(raw.propertyType ?? property.type),
    operation: String(raw.operationType || raw.tipoOperacion || property.operation || "venta").toLowerCase(),
    status: String(raw.status || "available").toLowerCase(),
    visibility: (["public","agents","private"].includes(String(raw.visibility)) ? String(raw.visibility) : "public") as AgentPropertyDraft["visibility"],
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    areaUnit: property.areaUnit,
    details,
    highlightedTags: tags.map(String).slice(0,2),
    lat: typeof raw.lat === "number" ? raw.lat : typeof raw.latitude === "number" ? raw.latitude : null,
    lng: typeof raw.lng === "number" ? raw.lng : typeof raw.longitude === "number" ? raw.longitude : null,
    contractStartDate: String(raw.contractStartDate || ""),
    contractEndDate: String(raw.contractEndDate || ""),
    videoType: String(video.type || raw.videoType || "") as AgentPropertyDraft["videoType"],
    videoUrl: String(video.url || raw.videoUrl || ""),
    images: property.images,
    coverImage: property.coverImage || property.images[0] || ""
  };
}

export function validateContractDates(start: string, end: string) {
  if (!start && !end) return { valid: true as const };
  if (!start || !end) return { valid: false as const, message: "Debes completar ambas fechas del contrato." };
  if (end < start) return { valid: false as const, message: "La fecha de vencimiento debe ser posterior o igual a la fecha de emisión." };
  return { valid: true as const };
}

export function buildAgentPropertyPayload(
  draft: AgentPropertyDraft,
  user: Pick<User,"uid"|"email"|"displayName">,
  agent?: Agent | null
) {
  const title=draft.title.trim();
  const description=draft.description.trim();
  const location=draft.location.trim();
  const type=normalizePropertyType(draft.type);
  const agentName=agent?.name || user.displayName || "";
  const images=[...new Set(draft.images.map(v=>v.trim()).filter(Boolean))];
  const coverImage=images.includes(draft.coverImage) ? draft.coverImage : images[0] || "";
  const details={...draft.details};
  if (draft.bedrooms !== null) details.bedrooms=draft.bedrooms;
  if (draft.bathrooms !== null) details.bathrooms=draft.bathrooms;
  if (draft.area !== null && !("totalArea" in details) && !("landArea" in details) && !("constructionArea" in details)) details.totalArea=draft.area;
  if (draft.areaUnit) details.areaUnit=draft.areaUnit;

  const areaValue =
    Number(details.totalArea || details.landArea || details.constructionArea || draft.area || 0) || null;
  const pricePerAreaUsd = areaValue && draft.priceUsd > 0 ? draft.priceUsd / areaValue : null;

  const payload: Record<string,unknown> = {
    title,titulo:title,
    price:draft.priceUsd,precio:draft.priceUsd,priceUsd:draft.priceUsd,
    descripcion:description,description,
    imagenes:images,images,coverImage,
    image:coverImage,imagen:coverImage,
    location,ubicacion:location,
    city:draft.department,department:draft.department,
    propertyType:type,type,tipo:type,
    operationType:draft.operation,operation:draft.operation,operacion:draft.operation,tipoOperacion:draft.operation,
    status:draft.status || "available",
    visibility:draft.visibility,
    bedrooms:draft.bedrooms,habitaciones:draft.bedrooms,
    bathrooms:draft.bathrooms,banos:draft.bathrooms,
    area:areaValue,areaValue,areaUnit:draft.areaUnit,
    pricePerAreaUsd,
    propertyDetails:details,
    highlightedTags:draft.highlightedTags.slice(0,2),tags:draft.highlightedTags.slice(0,2),
    lat:draft.lat,lng:draft.lng,
    agenteId:user.uid,agentId:user.uid,
    agentEmail:user.email || "",email:user.email || "",
    createdByEmail:user.email || "",ownerEmail:user.email || "",
    createdBy:user.uid,ownerId:user.uid,userId:user.uid,
    agentName,
    agentPhone:agent?.phone || "",
    agentWhatsapp:agent?.whatsapp || "",
    agentPhoto:agent?.photo || "",
    contractStartDate:draft.contractStartDate,
    contractEndDate:draft.contractEndDate
  };
  if(draft.videoType && draft.videoUrl){
    payload.video={type:draft.videoType,url:draft.videoUrl};
    payload.videoType=draft.videoType;
    payload.videoUrl=draft.videoUrl;
  }
  return payload;
}

export function emptyAgentPropertyDraft(): AgentPropertyDraft {
  return {
    title:"",priceUsd:0,location:"",department:"",description:"",type:"house",operation:"venta",
    status:"available",visibility:"public",bedrooms:null,bathrooms:null,area:null,areaUnit:"m²",
    details:{},highlightedTags:[],lat:null,lng:null,contractStartDate:"",contractEndDate:"",
    videoType:"",videoUrl:"",images:[],coverImage:""
  };
}
