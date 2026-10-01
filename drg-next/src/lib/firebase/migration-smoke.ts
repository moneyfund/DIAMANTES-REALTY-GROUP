import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "./client";
import { assertDrgWritesEnabled } from "@/lib/config/writes";

export type MigrationSmokeStep={
  key:string;
  label:string;
  status:"pending"|"running"|"success"|"error";
  detail?:string;
};

function stamp(){
  return new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,14);
}

export async function runMigrationSmokeTest(user:User,onStep:(step:MigrationSmokeStep)=>void){
  assertDrgWritesEnabled();
  const firebase=getFirebaseClient();
  if(!firebase)throw new Error("Firebase no está disponible.");

  const id="migration-smoke-"+stamp()+"-"+user.uid.slice(0,6);
  const propertyRef=doc(firebase.db,"properties",id);
  const auditRef=doc(firebase.db,"propertyListingAudit",id);
  const formRef=doc(firebase.db,"formularios",id);
  const listRef=doc(firebase.db,"sharedPropertyLists",id);
  const commentRef=doc(firebase.db,"properties",id,"comments","smoke-comment");
  const reviewRef=doc(firebase.db,"properties",id,"reviews","smoke-review");
  const storageRef=ref(firebase.storage,`properties/${user.uid}/${id}/smoke.txt`);

  const created:{property?:boolean;audit?:boolean;form?:boolean;list?:boolean;comment?:boolean;review?:boolean;storage?:boolean}={};

  async function step(key:string,label:string,fn:()=>Promise<string|void>){
    onStep({key,label,status:"running"});
    try{
      const detail=await fn();
      onStep({key,label,status:"success",detail:detail||"OK"});
    }catch(error){
      onStep({key,label,status:"error",detail:error instanceof Error?error.message:String(error)});
      throw error;
    }
  }

  try{
    await step("property","Crear propiedad temporal",async()=>{
      await setDoc(propertyRef,{
        title:"MIGRATION TEST - DO NOT USE",
        description:"Registro temporal de validación DRG 2.0",
        priceUsd:1,
        type:"house",
        typeLabel:"Casa",
        operation:"venta",
        status:"available",
        visibility:"private",
        publicationStatus:"pending_review",
        publicVisible:false,
        agentId:user.uid,
        agenteId:user.uid,
        ownerId:user.uid,
        userId:user.uid,
        createdBy:user.uid,
        agentEmail:user.email||"",
        ownerEmail:user.email||"",
        createdByEmail:user.email||"",
        agentName:user.displayName||"Migration Test",
        location:"Migration Test",
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      });
      created.property=true;
      return id;
    });

    await step("read","Leer propiedad temporal",async()=>{
      const snap=await getDoc(propertyRef);
      if(!snap.exists())throw new Error("La propiedad temporal no pudo leerse.");
      return snap.id;
    });

    await step("update","Actualizar propiedad temporal",async()=>{
      await updateDoc(propertyRef,{description:"MIGRATION TEST UPDATED",updatedAt:serverTimestamp()});
    });

    await step("comment","Crear comentario temporal",async()=>{
      await setDoc(commentRef,{
        propertyId:id,userId:user.uid,userName:user.displayName||"Migration Test",
        comment:"MIGRATION TEST COMMENT",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      created.comment=true;
    });

    await step("review","Crear reseña temporal",async()=>{
      await setDoc(reviewRef,{
        propertyId:id,userId:user.uid,userName:user.displayName||"Migration Test",
        rating:5,review:"",comment:"",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      created.review=true;
    });

    await step("form","Crear formulario temporal",async()=>{
      await setDoc(formRef,{
        tipo:"contacto",nombre:"Migration Test",telefono:"88888888",correo:"migration-test@example.invalid",
        mensaje:"MIGRATION TEST FORM",asunto:"Contacto web",estado:"nuevo",origen:"web-publica",
        paginaOrigen:"/migration-check",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      created.form=true;
    });

    await step("list","Crear lista compartida temporal",async()=>{
      await setDoc(listRef,{
        token:"migration_"+id,title:"MIGRATION TEST LIST",clientName:"",notes:"",propertyIds:[id],
        status:"active",createdByAgentId:user.uid,createdByAgentName:user.displayName||"Migration Test",
        createdByAgentPhone:"88888888",createdByAgentEmail:user.email||"",agentEmail:user.email||"",
        createdByEmail:user.email||"",agentWhatsapp:"88888888",createdByAgentWhatsapp:"88888888",
        createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      created.list=true;
    });

    await step("storage","Subir archivo temporal a Storage",async()=>{
      await uploadBytes(storageRef,new TextEncoder().encode("DRG MIGRATION SMOKE TEST"),{contentType:"text/plain"});
      created.storage=true;
      return await getDownloadURL(storageRef);
    });

    await step("cleanup","Limpiar registros temporales",async()=>{
      const tasks:Promise<unknown>[]=[];
      if(created.comment)tasks.push(deleteDoc(commentRef));
      if(created.review)tasks.push(deleteDoc(reviewRef));
      if(created.form)tasks.push(deleteDoc(formRef));
      if(created.list)tasks.push(deleteDoc(listRef));
      if(created.audit)tasks.push(deleteDoc(auditRef));
      if(created.property)tasks.push(deleteDoc(propertyRef));
      if(created.storage)tasks.push(deleteObject(storageRef));
      await Promise.all(tasks);
    });

    return {ok:true,id};
  }catch(error){
    // Best-effort cleanup. Failure here should not mask the original error.
    try{
      const tasks:Promise<unknown>[]=[];
      if(created.comment)tasks.push(deleteDoc(commentRef));
      if(created.review)tasks.push(deleteDoc(reviewRef));
      if(created.form)tasks.push(deleteDoc(formRef));
      if(created.list)tasks.push(deleteDoc(listRef));
      if(created.audit)tasks.push(deleteDoc(auditRef));
      if(created.property)tasks.push(deleteDoc(propertyRef));
      if(created.storage)tasks.push(deleteObject(storageRef));
      await Promise.allSettled(tasks);
    }catch{}
    throw error;
  }
}
