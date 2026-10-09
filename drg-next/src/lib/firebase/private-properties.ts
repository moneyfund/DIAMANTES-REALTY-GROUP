import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
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

function ownerIdentity(user:User,agent?:Agent|null){
  if(!agent)return {uid:user.uid,email:user.email||"",displayName:user.displayName||"Agente DRG"};
  return {
    uid:String(agent.raw.uid||agent.raw.userId||agent.raw.agentId||agent.id),
    email:agent.email||user.email||"",
    displayName:agent.name||user.displayName||"Agente DRG"
  };
}

export async function saveAgentProperty({
  id,draft,user,agent,createIfMissing=false,listingOwner
}:{id?:string;draft:AgentPropertyDraft;user:User;agent?:Agent|null;createIfMissing?:boolean;listingOwner?:Agent|null}){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=id?doc(firebase.db,"properties",id):doc(collection(firebase.db,"properties"));
  let existing:Property|null=null;
  let exists=false;

  if(id){
    const current=await getDoc(ref);
    if(current.exists()){
      exists=true;
      existing=normalizeProperty(current.id,current.data());
      if(!ownsPropertyForUser(existing,user,agent)) throw new Error("No tienes permisos para editar esta propiedad.");
    }else if(!createIfMissing){
      throw new Error("La propiedad no existe.");
    }
  }

  const ownershipKeys=[
    "agentId","agenteId","createdBy","ownerId","userId",
    "agentEmail","email","createdByEmail","ownerEmail"
  ] as const;

  if(id && exists && existing){
    // Editing must NEVER rewrite ownership. Legacy listings may identify an
    // agent by document id while Auth uses a Firebase UID. Preserve exactly
    // the ownership stored in Firestore so regular agent edits remain valid.
    const payload=buildAgentPropertyPayload(draft,user,agent);
    for(const key of ownershipKeys){
      if(Object.prototype.hasOwnProperty.call(existing.raw,key)) payload[key]=existing.raw[key];
      else delete payload[key];
    }

    const currentStatus=String(existing.raw.publicationStatus||"approved");
    const reviewFields=currentStatus==="rejected"
      ? {publicationStatus:"pending_review",publicVisible:false,reviewStatus:"pending_review",rejectionReason:"",resubmittedAt:serverTimestamp(),submittedAt:serverTimestamp()}
      : {publicationStatus:currentStatus,publicVisible:currentStatus==="approved"};

    await updateDoc(ref,{...payload,...reviewFields,lastEditedBy:user.uid,updatedAt:serverTimestamp()});
    return ref.id;
  }

  const uploaderEmail=String(user.email||"").trim().toLowerCase();
  const selected=listingOwner||agent||null;
  const selectedIdentity=selected?ownerIdentity(user,selected):{uid:user.uid,email:user.email||"",displayName:user.displayName||"Agente DRG"};
  const selectedUid=String(selectedIdentity.uid||"").trim();
  const selectedEmail=String(selectedIdentity.email||"").trim().toLowerCase();

  // Treat the current agent profile as the same owner whenever either its
  // Firebase UID OR its email matches the authenticated account.
  const isSameOwner=
    !listingOwner ||
    selectedUid===user.uid ||
    Boolean(selectedEmail && uploaderEmail && selectedEmail===uploaderEmail);

  const ownPayload=buildAgentPropertyPayload(draft,user,agent||selected);
  const createPayload={
    ...ownPayload,
    publicationStatus:"pending_review",
    publicVisible:false,
    reviewStatus:"pending_review",
    submittedAt:serverTimestamp(),
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  };

  // Always create the pending listing first as the authenticated uploader.
  // This matches Firestore create rules and guarantees images/URLs are not
  // lost if a later assisted-owner assignment cannot be completed.
  await setDoc(ref,createPayload,{merge:true});

  if(!isSameOwner && listingOwner){
    const targetPayload=buildAgentPropertyPayload(
      draft,
      selectedIdentity as Pick<User,"uid"|"email"|"displayName">,
      listingOwner
    );

    const ownershipPatch:Record<string,unknown>={
      updatedAt:serverTimestamp(),
      agentName:targetPayload.agentName,
      agentPhone:targetPayload.agentPhone,
      agentWhatsapp:targetPayload.agentWhatsapp,
      agentPhoto:targetPayload.agentPhoto,
    };
    for(const key of ownershipKeys) ownershipPatch[key]=targetPayload[key];

    const batch=writeBatch(firebase.db);
    batch.update(ref,ownershipPatch);
    batch.set(doc(firebase.db,"propertyListingAudit",ref.id),{
      propertyId:ref.id,
      uploadedByAgentId:user.uid,
      uploadedByAgentEmail:uploaderEmail,
      uploadedByAgentName:agent?.name||user.displayName||user.email||"Agente DRG",
      ownerAgentId:selectedUid,
      ownerAgentEmail:selectedEmail,
      ownerAgentName:listingOwner.name||selectedIdentity.displayName||"Agente DRG",
      source:"agent-dashboard-assisted-listing",
      createdAt:serverTimestamp()
    });
    await batch.commit();
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

export async function removeLegalDocumentFromAgentProperty(id:string,user:User,agent?:Agent|null){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const ref=doc(firebase.db,"properties",id);
  const snapshot=await getDoc(ref); if(!snapshot.exists()) throw new Error("La propiedad no existe.");
  const property=normalizeProperty(snapshot.id,snapshot.data());
  if(!ownsPropertyForUser(property,user,agent)) throw new Error("No tienes permisos para modificar esta propiedad.");
  const legal=property.raw.legalDocument && typeof property.raw.legalDocument==="object" ? property.raw.legalDocument as Record<string,unknown> : null;
  await updateDoc(ref,{legalDocument:null,updatedAt:serverTimestamp()});
  return String(legal?.storagePath||"");
}
