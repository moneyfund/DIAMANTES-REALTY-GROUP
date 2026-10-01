import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";

async function main(){
const projectId="demo-drg-next";
const firestoreRules=readFileSync("../security/firestore.rules.proposed","utf8");
const storageRules=readFileSync("../security/storage.rules.proposed","utf8");

const env=await initializeTestEnvironment({
  projectId,
  firestore:{host:"127.0.0.1",port:8087,rules:firestoreRules},
  storage:{host:"127.0.0.1",port:9197,rules:storageRules}
});

try{
  await env.clearFirestore();
  await env.clearStorage();

  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"agents","uid-agent"),{
      uid:"uid-agent",agentId:"uid-agent",email:"valop27@gmail.com",name:"Agente Uno",active:true
    });
    await setDoc(doc(db,"agents","uid-target"),{
      uid:"uid-target",agentId:"uid-target",email:"dra.nazarethbravo@gmail.com",name:"Agente Destino",active:true
    });
    await setDoc(doc(db,"properties","public-property"),{
      title:"Propiedad pública",visibility:"public",publicationStatus:"approved",publicVisible:true,status:"available",
      agentId:"uid-agent",agentEmail:"valop27@gmail.com",createdBy:"uid-agent",createdByEmail:"valop27@gmail.com"
    });
    await setDoc(doc(db,"properties","private-property"),{
      title:"Propiedad privada",visibility:"private",publicationStatus:"pending_review",publicVisible:false,status:"available",
      agentId:"uid-agent",agentEmail:"valop27@gmail.com",createdBy:"uid-agent",createdByEmail:"valop27@gmail.com"
    });
    await setDoc(doc(db,"sharedPropertyLists","active-list"),{
      token:"share_active",title:"Lista activa",status:"active",propertyIds:["public-property"],
      createdByAgentId:"uid-agent",createdByAgentEmail:"valop27@gmail.com"
    });
    await setDoc(doc(db,"sharedPropertyLists","inactive-list"),{
      token:"share_inactive",title:"Lista inactiva",status:"inactive",propertyIds:["public-property"],
      createdByAgentId:"uid-agent",createdByAgentEmail:"valop27@gmail.com"
    });
  });

  const guest=env.unauthenticatedContext();
  const agent=env.authenticatedContext("uid-agent",{email:"valop27@gmail.com",email_verified:true});
  const uploader=env.authenticatedContext("uid-uploader",{email:"norvingarcia220@gmail.com",email_verified:true});
  const admin=env.authenticatedContext("uid-admin",{email:"diamantesrealtygroup@gmail.com",email_verified:true});

  // Public visibility boundaries.
  await assertSucceeds(getDoc(doc(guest.firestore(),"properties","public-property")));
  await assertFails(getDoc(doc(guest.firestore(),"properties","private-property")));
  await assertSucceeds(getDoc(doc(agent.firestore(),"properties","private-property")));

  // Public shared links: active is readable; inactive remains private to the owning agent/admin.
  await assertSucceeds(getDoc(doc(guest.firestore(),"sharedPropertyLists","active-list")));
  await assertFails(getDoc(doc(guest.firestore(),"sharedPropertyLists","inactive-list")));
  await assertSucceeds(getDoc(doc(agent.firestore(),"sharedPropertyLists","inactive-list")));
  await assertSucceeds(getDocs(query(
    collection(guest.firestore(),"sharedPropertyLists"),
    where("token","==","share_active"),
    where("status","==","active")
  )));

  // Valid public form succeeds; malformed public payload is denied.
  await assertSucceeds(setDoc(doc(guest.firestore(),"formularios","form-valid"),{
    tipo:"contacto",nombre:"Cliente Demo",telefono:"88888888",correo:"cliente@example.com",
    mensaje:"Deseo información",asunto:"Contacto web",estado:"nuevo",origen:"web-publica",
    paginaOrigen:"/contacto",createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  }));
  await assertFails(setDoc(doc(guest.firestore(),"formularios","form-invalid"),{
    tipo:"otro",nombre:"X",telefono:"1",mensaje:"",estado:"nuevo",origen:"web-publica"
  }));

  // Owner can create a pending private listing.
  await assertSucceeds(setDoc(doc(agent.firestore(),"properties","agent-created"),{
    title:"Creada por agente",visibility:"public",publicationStatus:"pending_review",publicVisible:false,status:"available",
    agentId:"uid-agent",agenteId:"uid-agent",ownerId:"uid-agent",userId:"uid-agent",createdBy:"uid-agent",
    agentEmail:"valop27@gmail.com",createdByEmail:"valop27@gmail.com",ownerEmail:"valop27@gmail.com"
  }));

  // Assisted listing is atomic: uploader + audit + target owner.
  const assistedBatch=writeBatch(uploader.firestore());
  assistedBatch.set(doc(uploader.firestore(),"properties","assisted-property"),{
    title:"Carga asistida",visibility:"public",publicationStatus:"pending_review",publicVisible:false,status:"available",
    agentId:"uid-target",agenteId:"uid-target",ownerId:"uid-target",userId:"uid-target",createdBy:"uid-target",
    agentEmail:"dra.nazarethbravo@gmail.com",createdByEmail:"dra.nazarethbravo@gmail.com",
    ownerEmail:"dra.nazarethbravo@gmail.com",email:"dra.nazarethbravo@gmail.com",agentName:"Agente Destino"
  });
  assistedBatch.set(doc(uploader.firestore(),"propertyListingAudit","assisted-property"),{
    propertyId:"assisted-property",uploadedByAgentId:"uid-uploader",
    uploadedByAgentEmail:"norvingarcia220@gmail.com",uploadedByAgentName:"Uploader",
    ownerAgentId:"uid-target",ownerAgentEmail:"dra.nazarethbravo@gmail.com",ownerAgentName:"Agente Destino",
    source:"drg-next-assisted-listing",createdAt:serverTimestamp()
  });
  await assertSucceeds(assistedBatch.commit());

  // A normal client cannot approve; Admin can.
  const client=env.authenticatedContext("uid-client",{email:"client@example.com",email_verified:true});
  await assertFails(updateDoc(doc(client.firestore(),"properties","agent-created"),{
    publicationStatus:"approved",publicVisible:true
  }));
  await assertSucceeds(updateDoc(doc(admin.firestore(),"properties","agent-created"),{
    publicationStatus:"approved",publicVisible:true
  }));

  // Comments/reviews preserve user ownership.
  await assertSucceeds(setDoc(doc(agent.firestore(),"properties","public-property","comments","comment-1"),{
    userId:"uid-agent",userName:"Agente Uno",comment:"Comentario",createdAt:serverTimestamp()
  }));
  await assertFails(setDoc(doc(client.firestore(),"properties","public-property","comments","forged"),{
    userId:"uid-agent",comment:"Suplantación",createdAt:serverTimestamp()
  }));

  // Storage: public listing images remain public; only authorized uploader/owner can write/delete.
  const agentStorage=agent.storage();
  const guestStorage=guest.storage();
  const otherAgent=env.authenticatedContext("uid-other",{email:"rubenn2121@gmail.com",email_verified:true});
  const imageRef=ref(agentStorage,"properties/uid-agent/private-property/test.jpg");
  await assertSucceeds(uploadBytes(imageRef,new Uint8Array([1,2,3]),{contentType:"image/jpeg"}));
  await assertSucceeds(getBytes(ref(guestStorage,"properties/uid-agent/private-property/test.jpg")));
  await assertFails(uploadBytes(ref(otherAgent.storage(),"properties/uid-agent/private-property/other.jpg"),new Uint8Array([1]),{contentType:"image/jpeg"}));

  // Legal PDFs are not public.
  const legalRef=ref(agentStorage,"property-legal-documents/private-property/legal.pdf");
  await assertSucceeds(uploadBytes(legalRef,new Uint8Array([37,80,68,70]),{contentType:"application/pdf"}));
  await assertFails(getBytes(ref(guestStorage,"property-legal-documents/private-property/legal.pdf")));
  await assertSucceeds(getBytes(ref(agentStorage,"property-legal-documents/private-property/legal.pdf")));
  await assertSucceeds(getBytes(ref(admin.storage(),"property-legal-documents/private-property/legal.pdf")));

  console.log("Security behavior tests passed");
}finally{
  await env.cleanup();
}

}

main().catch((error)=>{
  console.error(error);
  process.exitCode=1;
});
