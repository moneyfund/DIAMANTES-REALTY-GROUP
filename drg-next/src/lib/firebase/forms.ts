import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";

export type PublicFormKind="contacto"|"quiero-vender";

export type ContactFormPayload={
  nombre:string;
  telefono:string;
  correo:string;
  mensaje:string;
  paginaOrigen:string;
};

export type SellerFormPayload=ContactFormPayload&{
  tipoPropiedad:string;
  modalidad:string;
  ciudad:string;
};

export function cleanPublicFormValue(value:unknown,max:number){
  return String(value||"")
    .replace(/[<>]/g,"")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,max);
}

function commonPayload(kind:PublicFormKind,data:ContactFormPayload|SellerFormPayload){
  return {
    tipo:kind,
    nombre:cleanPublicFormValue(data.nombre,100),
    telefono:cleanPublicFormValue(data.telefono,30),
    correo:cleanPublicFormValue(data.correo,160).toLowerCase(),
    mensaje:cleanPublicFormValue(data.mensaje,3000),
    asunto:kind==="contacto"?"Contacto web":cleanPublicFormValue((data as SellerFormPayload).tipoPropiedad,80),
    estado:"nuevo",
    origen:"web-publica",
    paginaOrigen:cleanPublicFormValue(data.paginaOrigen,300)
  };
}

function validateBase(payload:ReturnType<typeof commonPayload>){
  if(!payload.nombre||!payload.telefono||!payload.correo||!payload.mensaje){
    throw new Error("No se permiten envíos vacíos. Revisa los campos obligatorios.");
  }
}

export async function submitContactForm(data:ContactFormPayload){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("No pudimos conectar con el servicio.");
  const payload=commonPayload("contacto",data);
  validateBase(payload);
  const timestamp=serverTimestamp();
  const ref=await addDoc(collection(firebase.db,"formularios"),{...payload,createdAt:timestamp,updatedAt:timestamp});
  return ref.id;
}

export async function submitSellerForm(data:SellerFormPayload){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("No pudimos conectar con el servicio.");
  const base=commonPayload("quiero-vender",data);
  const payload={
    ...base,
    tipoPropiedad:cleanPublicFormValue(data.tipoPropiedad,80),
    modalidad:cleanPublicFormValue(data.modalidad,30),
    ciudad:cleanPublicFormValue(data.ciudad,120)
  };
  validateBase(payload);
  if(!payload.tipoPropiedad||!payload.modalidad||!payload.ciudad){
    throw new Error("Completa tipo de propiedad, modalidad y ciudad.");
  }
  const timestamp=serverTimestamp();
  const ref=await addDoc(collection(firebase.db,"formularios"),{...payload,createdAt:timestamp,updatedAt:timestamp});
  return ref.id;
}
