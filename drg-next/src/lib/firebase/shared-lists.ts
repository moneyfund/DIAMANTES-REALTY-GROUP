import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";
import { normalizeProperty } from "@/lib/properties/normalize";
import { ownsPropertyForUser } from "@/lib/properties/private";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";

export type SharedPropertyList={
  id:string;token:string;title:string;clientName:string;notes:string;propertyIds:string[];status:"active"|"inactive";
  createdByAgentId:string;createdByAgentName:string;createdByAgentPhone:string;createdByAgentPhoto:string;
  createdByAgentEmail:string;createdByAgentWhatsapp:string;createdAt:unknown;updatedAt:unknown;raw:Record<string,unknown>;
};

function normalize(id:string,raw:Record<string,unknown>):SharedPropertyList{
  return {
    id,token:String(raw.token||""),title:String(raw.title||"Lista compartida"),clientName:String(raw.clientName||""),
    notes:String(raw.notes||""),propertyIds:Array.isArray(raw.propertyIds)?raw.propertyIds.map(String):[],
    status:String(raw.status||"active")==="inactive"?"inactive":"active",
    createdByAgentId:String(raw.createdByAgentId||raw.agentId||raw.createdBy||""),
    createdByAgentName:String(raw.createdByAgentName||""),
    createdByAgentPhone:String(raw.createdByAgentPhone||""),
    createdByAgentPhoto:String(raw.createdByAgentPhoto||""),
    createdByAgentEmail:String(raw.createdByAgentEmail||raw.agentEmail||raw.createdByEmail||""),
    createdByAgentWhatsapp:String(raw.createdByAgentWhatsapp||raw.agentWhatsapp||""),
    createdAt:raw.createdAt||null,updatedAt:raw.updatedAt||null,raw
  };
}

function matchesUser(list:SharedPropertyList,user:Pick<User,"uid"|"email">){
  const email=String(user.email||"").toLowerCase();
  return list.createdByAgentId===user.uid ||
    Boolean(email && [list.createdByAgentEmail,String(list.raw.agentEmail||""),String(list.raw.createdByEmail||"")].some(v=>v.toLowerCase()===email));
}

export async function readOwnSharedLists(user:Pick<User,"uid"|"email">){
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const defs:[string,string][]=[["createdByAgentId",user.uid]];
  if(user.email)defs.push(["createdByAgentEmail",user.email],["agentEmail",user.email],["createdByEmail",user.email]);
  const results=await Promise.allSettled(defs.map(async([field,value])=>{
    const snap=await getDocs(query(collection(firebase.db,"sharedPropertyLists"),where(field,"==",value)));
    return snap.docs.map(row=>normalize(row.id,row.data()));
  }));
  const merged=new Map<string,SharedPropertyList>();
  for(const result of results)if(result.status==="fulfilled")for(const item of result.value)if(matchesUser(item,user))merged.set(item.id,item);
  return [...merged.values()].sort((a,b)=>timestamp(b.updatedAt||b.createdAt)-timestamp(a.updatedAt||a.createdAt));
}

function timestamp(value:unknown){
  if(value&&typeof value==="object"&&"seconds" in value)return Number((value as {seconds?:unknown}).seconds||0);
  return 0;
}

export async function createSharedPropertyList({
  user,agent,title,clientName,notes,propertyIds
}:{user:User;agent?:Agent|null;title:string;clientName?:string;notes?:string;propertyIds:string[]}){
  assertDrgWritesEnabled();
  const cleanTitle=title.trim();
  const ids=[...new Set(propertyIds.map(String).filter(Boolean))];
  if(!cleanTitle)throw new Error("El título de la lista es obligatorio.");
  if(!ids.length)throw new Error("Selecciona al menos una propiedad.");
  const whatsapp=agent?.whatsapp||agent?.phone||"";
  if(!whatsapp)throw new Error("Completa teléfono o WhatsApp en tu perfil antes de crear listas.");
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no disponible.");
  const ref=doc(collection(firebase.db,"sharedPropertyLists"));
  const token="share_"+crypto.randomUUID().replaceAll("-","").slice(0,12);
  await setDoc(ref,{
    token,title:cleanTitle,clientName:String(clientName||"").trim(),notes:String(notes||"").trim(),propertyIds:ids,status:"active",
    createdByAgentId:user.uid,createdByAgentName:agent?.name||user.displayName||"Agente",
    createdByAgentPhone:agent?.phone||"",createdByAgentPhoto:agent?.photo||user.photoURL||"",
    createdByAgentEmail:agent?.email||user.email||"",agentEmail:agent?.email||user.email||"",
    createdByEmail:agent?.email||user.email||"",agentWhatsapp:whatsapp,createdByAgentWhatsapp:whatsapp,
    createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  },{merge:true});
  return {id:ref.id,token};
}

export async function setSharedListStatus(id:string,status:"active"|"inactive",user:User){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no disponible.");
  const ref=doc(firebase.db,"sharedPropertyLists",id);
  const snap=await getDoc(ref); if(!snap.exists())throw new Error("Lista no encontrada.");
  const item=normalize(snap.id,snap.data());
  if(!matchesUser(item,user))throw new Error("No tienes permisos sobre esta lista.");
  await updateDoc(ref,{status,updatedAt:serverTimestamp()});
}

export async function deleteSharedList(id:string,user:User){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no disponible.");
  const ref=doc(firebase.db,"sharedPropertyLists",id);
  const snap=await getDoc(ref); if(!snap.exists())return;
  const item=normalize(snap.id,snap.data());
  if(!matchesUser(item,user))throw new Error("No tienes permisos sobre esta lista.");
  await deleteDoc(ref);
}

export async function readShareableBrokerageProperties(currentUser?:Pick<User,"uid"|"email"|"displayName">,agent?:Agent|null){
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const snap=await getDocs(collection(firebase.db,"properties"));
  return snap.docs.map(row=>normalizeProperty(row.id,row.data())).filter(property=>{
    const raw=property.raw;
    const publication=String(raw.publicationStatus||"approved");
    const visible=raw.publicVisible===true || (raw.publicationStatus===undefined&&raw.publicVisible===undefined);
    const status=String(property.status||"").toLowerCase();
    const visibility=String(raw.visibility||"public");
    const approved=publication==="approved"&&visible;
    const legacy=raw.publicationStatus===undefined&&raw.publicVisible===undefined;
    const own=currentUser?ownsPropertyForUser(property,currentUser as never,agent):false;
    return (approved||legacy||own) && visibility!=="private" && !["sold","vendida","vendido","archived"].includes(status) && publication!=="archived";
  });
}

export async function readSharedListByToken(token:string){
  const firebase=getFirebaseClient(); if(!firebase||!token)return null;
  const snap=await getDocs(query(collection(firebase.db,"sharedPropertyLists"),where("token","==",token),where("status","==","active")));
  const first=snap.docs[0]; return first?normalize(first.id,first.data()):null;
}

export async function readShareablePropertiesByIds(ids:string[]){
  const firebase=getFirebaseClient(); if(!firebase)return[];
  const unique=[...new Set(ids.filter(Boolean))];
  const loaded:Property[]=[];
  for(const id of unique){
    const snap=await getDoc(doc(firebase.db,"properties",id));
    if(!snap.exists())continue;
    const property=normalizeProperty(snap.id,snap.data());
    const raw=property.raw;
    const publication=String(raw.publicationStatus||"approved");
    const visible=raw.publicVisible===true || (raw.publicationStatus===undefined&&raw.publicVisible===undefined);
    const status=String(property.status||"").toLowerCase();
    if((publication==="approved"&&visible || raw.publicationStatus===undefined&&raw.publicVisible===undefined) &&
       publication!=="archived" && !["sold","vendida","vendido","archived"].includes(status))loaded.push(property);
  }
  const order=new Map(unique.map((id,index)=>[id,index]));
  return loaded.sort((a,b)=>(order.get(a.id)||0)-(order.get(b.id)||0));
}
