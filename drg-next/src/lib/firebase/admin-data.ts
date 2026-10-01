import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";
import { normalizeProperty } from "@/lib/properties/normalize";
import { normalizeAgent } from "@/lib/agents/normalize";
import type { Property } from "@/types/property";
import type { Agent } from "@/types/agent";

export type AdminFormItem = {
  id:string;
  tipo:string;
  estado:string;
  nombre:string;
  correo:string;
  telefono:string;
  asunto:string;
  tipoPropiedad:string;
  mensaje:string;
  createdAt:unknown;
  updatedAt:unknown;
  raw:Record<string,unknown>;
};

export async function readAllAdminProperties():Promise<Property[]>{
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const snapshot=await getDocs(collection(firebase.db,"properties"));
  return snapshot.docs.map(entry=>normalizeProperty(entry.id,entry.data()));
}

export async function readAllAdminAgents():Promise<Agent[]>{
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const snapshot=await getDocs(collection(firebase.db,"agents"));
  return snapshot.docs.map(entry=>normalizeAgent(entry.id,entry.data()));
}

export async function readAdminForms():Promise<AdminFormItem[]>{
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const snapshot=await getDocs(collection(firebase.db,"formularios"));
  return snapshot.docs.map(entry=>{
    const raw=entry.data() as Record<string,unknown>;
    return {
      id:entry.id,tipo:String(raw.tipo||""),estado:String(raw.estado||"nuevo"),
      nombre:String(raw.nombre||raw.name||""),correo:String(raw.correo||raw.email||""),
      telefono:String(raw.telefono||raw.phone||""),asunto:String(raw.asunto||""),
      tipoPropiedad:String(raw.tipoPropiedad||raw.propertyType||""),mensaje:String(raw.mensaje||raw.message||""),
      createdAt:raw.createdAt||null,updatedAt:raw.updatedAt||null,raw
    };
  });
}

export async function approvePropertyAsAdmin(propertyId:string,user:User){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no está disponible.");
  await updateDoc(doc(firebase.db,"properties",propertyId),{
    publicationStatus:"approved",publicVisible:true,approvedAt:serverTimestamp(),approvedBy:user.uid,
    reviewedAt:serverTimestamp(),reviewStatus:"approved",rejectionReason:""
  });
}

export async function rejectPropertyAsAdmin(propertyId:string,user:User,reason:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no está disponible.");
  const clean=reason.trim(); if(!clean)throw new Error("El motivo de rechazo es obligatorio.");
  await updateDoc(doc(firebase.db,"properties",propertyId),{
    publicationStatus:"rejected",publicVisible:false,rejectedAt:serverTimestamp(),rejectedBy:user.uid,
    reviewedAt:serverTimestamp(),reviewStatus:"rejected",rejectionReason:clean
  });
}

export async function renameAgentAsAdmin(agentId:string,name:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no está disponible.");
  const clean=name.trim(); if(clean.length<2)throw new Error("Ingresa un nombre válido.");
  await updateDoc(doc(firebase.db,"agents",agentId),{name:clean,updatedAt:serverTimestamp()});
  const properties=await readAllAdminProperties();
  const matching=properties.filter(property=>{
    const raw=property.raw;
    return [raw.agentId,raw.agenteId,raw.ownerId,raw.userId,raw.createdBy].map(String).includes(agentId);
  });
  await Promise.all(matching.map(property=>updateDoc(doc(firebase.db,"properties",property.id),{agentName:clean,updatedAt:serverTimestamp()})));
}

export async function updateFormStatusAsAdmin(formId:string,status:string){
  assertDrgWritesEnabled();
  const allowed=["nuevo","leido","respondido","archivado"];
  if(!allowed.includes(status))throw new Error("Estado no válido.");
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no está disponible.");
  await updateDoc(doc(firebase.db,"formularios",formId),{estado:status,updatedAt:serverTimestamp()});
}

export async function deleteFormAsAdmin(formId:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no está disponible.");
  await deleteDoc(doc(firebase.db,"formularios",formId));
}
