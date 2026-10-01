import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";

export type AgentProfileDraft={
  name:string;description:string;email:string;phone:string;licenseNumber:string;
  instagram:string;facebook:string;tiktok:string;whatsapp:string;photo?:string;
};

export async function saveAgentProfile(user:User,profileDocId:string|undefined,draft:AgentProfileDraft){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient(); if(!firebase) throw new Error("Firebase no está disponible.");
  const id=profileDocId||user.uid;
  await setDoc(doc(firebase.db,"agents",id),{
    name:draft.name.trim()||user.displayName||"Agente Diamantes Realty Group",
    description:draft.description.trim(),email:draft.email.trim()||user.email||"",
    uid:user.uid,agentId:user.uid,phone:draft.phone.trim(),licenseNumber:draft.licenseNumber.trim(),
    instagram:draft.instagram.trim(),facebook:draft.facebook.trim(),tiktok:draft.tiktok.trim(),whatsapp:draft.whatsapp.trim(),
    ...(draft.photo!==undefined?{photo:draft.photo}:{}),updatedAt:serverTimestamp()
  },{merge:true});
  return id;
}
