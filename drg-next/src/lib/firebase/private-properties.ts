import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, type QueryConstraint } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";
import { normalizeProperty } from "@/lib/properties/normalize";
import { buildAgentPropertyPayload, ownsPropertyForUser, type AgentPropertyDraft } from "@/lib/properties/private";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";

async function runPropertyQuery(field: string, value: string) {
  const firebase=getFirebaseClient();
  if(!firebase || !value) return [] as Property[];
  const snapshot=await getDocs(query(collection(firebase.db,"properties"),where(field,"==",value)));
  return snapshot.docs.map(entry=>normalizeProperty(entry.id,entry.data()));
}

export async function readAgentProperties(user: Pick<User,"uid"|"email"|"displayName">, agent?: Agent | null) {
  const definitions:[string,string][]=[
    ["agentId",user.uid],["agenteId",user.uid],["createdBy",user.uid],["ownerId",user.uid],["userId",user.uid]
  ];
  if(user.email) definitions.push(
    ["agentEmail",user.email],["email",user.email],["createdByEmail",user.email],["ownerEmail",user.email],["createdBy",user.email]
  );
  const unique=definitions.filter(([f,v],i,a)=>v&&a.findIndex(([ff,vv])=>ff===f&&vv===v)===i);
  const settled=await Promise.allSettled(unique.map(([field,value])=>runPropertyQuery(field,value)));
  const merged=new Map<string,Property>();
  for(const result of settled) if(result.status==="fulfilled") for(const property of result.value) {
    if(ownsPropertyForUser(property,user,agent)) merged.set(property.id,property);
  }
  return [...merged.values()];
}

export async function readPrivatePropertyById(id:string){
  const firebase=getFirebaseClient(); if(!firebase||!id) return null;
  const snapshot=await getDoc(doc(firebase.db,"properties",id));
  return snapshot.exists()?normalizeProperty(snapshot.id,snapshot.data()):null;
}

export function reserveAgentPropertyId(){
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  return doc(collection(firebase.db,"properties")).id;
}

export async function saveAgentProperty({
  id,draft,user,agent,createIfMissing=false
}:{id?:string;draft:AgentPropertyDraft;user:User;agent?:Agent|null;createIfMissing?:boolean}){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=id?doc(firebase.db,"properties",id):doc(collection(firebase.db,"properties"));
  let existing:Property|null=null;
  let exists=false;
  if(id){
    const current=await getDoc(ref);
    exists=current.exists();
    if(exists){
      existing=normalizeProperty(current.id,current.data());
      if(!ownsPropertyForUser(existing,user,agent)) throw new Error("No tienes permisos para editar esta propiedad.");
    }else if(!createIfMissing){
      throw new Error("La propiedad no existe.");
    }
  }
  const payload=buildAgentPropertyPayload(draft,user,agent);
  if(id && exists){
    const currentStatus=String(existing?.raw.publicationStatus||"approved");
    const reviewFields=currentStatus==="rejected"
      ? {publicationStatus:"pending_review",publicVisible:false,reviewStatus:"pending_review",rejectionReason:"",resubmittedAt:serverTimestamp(),submittedAt:serverTimestamp()}
      : {publicationStatus:currentStatus,publicVisible:currentStatus==="approved"};
    await updateDoc(ref,{...payload,...reviewFields,lastEditedBy:user.uid,updatedAt:serverTimestamp()});
  }else{
    await setDoc(ref,{...payload,publicationStatus:"pending_review",publicVisible:false,reviewStatus:"pending_review",submittedAt:serverTimestamp(),createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});
  }
  return ref.id;
}

export async function markAgentPropertySold(id:string,user:User,agent?:Agent|null){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=doc(firebase.db,"properties",id); const snapshot=await getDoc(ref);
  if(!snapshot.exists()) throw new Error("La propiedad no existe.");
  const property=normalizeProperty(snapshot.id,snapshot.data());
  if(!ownsPropertyForUser(property,user,agent)) throw new Error("No tienes permisos para modificar esta propiedad.");
  await updateDoc(ref,{status:"sold",updatedAt:serverTimestamp()});
}

export async function deleteAgentProperty(id:string,user:User,agent?:Agent|null){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=doc(firebase.db,"properties",id); const snapshot=await getDoc(ref);
  if(!snapshot.exists()) return;
  const property=normalizeProperty(snapshot.id,snapshot.data());
  if(!ownsPropertyForUser(property,user,agent)) throw new Error("No tienes permisos para eliminar esta propiedad.");
  await deleteDoc(ref);
}

export async function attachLegalDocumentToAgentProperty(
  id:string,user:User,legalDocument:{fileName:string;fileUrl:string;storagePath:string},agent?:Agent|null
){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=doc(firebase.db,"properties",id);
  const snapshot=await getDoc(ref);
  if(!snapshot.exists()) throw new Error("La propiedad no existe.");
  const property=normalizeProperty(snapshot.id,snapshot.data());
  if(!ownsPropertyForUser(property,user,agent)) throw new Error("No tienes permisos para modificar esta propiedad.");
  await updateDoc(ref,{legalDocument:{...legalDocument,visibility:"private"},updatedAt:serverTimestamp()});
}
