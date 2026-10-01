import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";

function safeFileName(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,"_")}

export async function uploadAgentPropertyImage(file:File,agentId:string,propertyId:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase Storage no está disponible.");
  if(!file.type.startsWith("image/")) throw new Error("Selecciona un archivo de imagen válido.");
  if(file.size>15*1024*1024) throw new Error("La imagen no puede superar 15 MB.");
  const path=`properties/${agentId}/${propertyId}/${Date.now()}-${safeFileName(file.name||"image")}`;
  const snapshot=await uploadBytes(ref(firebase.storage,path),file,{contentType:file.type||"image/jpeg"});
  return {url:await getDownloadURL(snapshot.ref),path};
}

export async function uploadAgentProfilePhoto(file:File,userId:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase Storage no está disponible.");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("La foto debe ser JPG, PNG o WEBP.");
  if(file.size>5*1024*1024) throw new Error("La foto no puede superar 5 MB.");
  const extension=(file.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase();
  const path=`agents/${userId}/profile/profile-${Date.now()}.${extension==="jpeg"?"jpg":extension}`;
  const snapshot=await uploadBytes(ref(firebase.storage,path),file,{contentType:file.type});
  return {url:await getDownloadURL(snapshot.ref),path};
}

export async function uploadLegalPdf(file:File,propertyId:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase Storage no está disponible.");
  if(!(file.name.toLowerCase().endsWith(".pdf")&&(file.type==="application/pdf"||!file.type))) throw new Error("El documento legal debe ser PDF.");
  if(file.size>20*1024*1024) throw new Error("El PDF no puede superar 20 MB.");
  const path=`property-legal-documents/${propertyId}/${Date.now()}-${safeFileName(file.name||"documento-legal.pdf")}`;
  const snapshot=await uploadBytes(ref(firebase.storage,path),file,{contentType:"application/pdf",customMetadata:{propertyId,visibility:"private"}});
  return {url:await getDownloadURL(snapshot.ref),path};
}

export async function deleteStoragePath(path:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase||!path) return;
  await deleteObject(ref(firebase.storage,path));
}

export async function uploadAdminPropertyImage(file:File,propertyId:string){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase Storage no está disponible.");
  if(!file.type.startsWith("image/")) throw new Error("Selecciona un archivo de imagen válido.");
  if(file.size>15*1024*1024) throw new Error("La imagen no puede superar 15 MB.");
  const path=`properties/${propertyId}/admin/${Date.now()}-${safeFileName(file.name||"image")}`;
  const snapshot=await uploadBytes(ref(firebase.storage,path),file,{contentType:file.type||"image/jpeg"});
  return {url:await getDownloadURL(snapshot.ref),path};
}
