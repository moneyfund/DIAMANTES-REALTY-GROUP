import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";

export type PropertyInteraction={
  id:string;userId:string;userName:string;userPhoto:string;comment:string;review:string;rating:number;createdAt:unknown;
};

function normalize(id:string,data:Record<string,unknown>):PropertyInteraction{
  return {
    id,userId:String(data.userId||""),userName:String(data.userName||data.authorName||"Usuario"),
    userPhoto:String(data.userPhoto||""),comment:String(data.comment||""),review:String(data.review||""),
    rating:Math.max(0,Math.min(5,Number(data.rating||0))),createdAt:data.createdAt||null
  };
}

export function subscribePropertyInteractions(
  propertyId:string,
  callbacks:{comments:(items:PropertyInteraction[])=>void;reviews:(items:PropertyInteraction[])=>void;error:(error:unknown)=>void}
):Unsubscribe{
  const firebase=getFirebaseClient(); if(!firebase){callbacks.error(new Error("Firebase no disponible"));return()=>{}}
  const unsubComments=onSnapshot(
    query(collection(firebase.db,"properties",propertyId,"comments"),orderBy("createdAt","desc"),limit(120)),
    snap=>callbacks.comments(snap.docs.map(doc=>normalize(doc.id,doc.data()))),callbacks.error
  );
  const unsubReviews=onSnapshot(
    query(collection(firebase.db,"properties",propertyId,"reviews"),orderBy("createdAt","desc"),limit(120)),
    snap=>callbacks.reviews(snap.docs.map(doc=>normalize(doc.id,doc.data()))),callbacks.error
  );
  return()=>{unsubComments();unsubReviews()};
}

export async function publishPropertyComment(propertyId:string,user:User,comment:string){
  assertDrgWritesEnabled();
  const text=comment.trim(); if(!text)throw new Error("Escribe un comentario.");
  if(text.length>1200)throw new Error("El comentario no puede superar 1200 caracteres.");
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no disponible.");
  await addDoc(collection(firebase.db,"properties",propertyId,"comments"),{
    propertyId,userId:user.uid,userName:user.displayName||"Usuario",userPhoto:user.photoURL||"",comment:text,
    createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
}

export async function publishPropertyReview(propertyId:string,user:User,rating:number){
  assertDrgWritesEnabled();
  const value=Math.round(Number(rating)); if(value<1||value>5)throw new Error("Selecciona de 1 a 5 estrellas.");
  const firebase=getFirebaseClient(); if(!firebase)throw new Error("Firebase no disponible.");
  await addDoc(collection(firebase.db,"properties",propertyId,"reviews"),{
    propertyId,userId:user.uid,userName:user.displayName||"Usuario",userPhoto:user.photoURL||"",rating:value,
    review:"",comment:"",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
}
