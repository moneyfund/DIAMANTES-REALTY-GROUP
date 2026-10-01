import { readFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

function extractConfig(source: string) {
  const read = (key: string) => source.match(new RegExp(key + "\\s*:\\s*['\"]([^'\"]+)['\"]"))?.[1] ?? "";
  return { apiKey:read("apiKey"),authDomain:read("authDomain"),projectId:read("projectId"),storageBucket:read("storageBucket"),messagingSenderId:read("messagingSenderId"),appId:read("appId") };
}
const norm=(v:unknown)=>String(v||"").trim().toLowerCase();
const values=(data:Record<string,unknown>,keys:string[])=>keys.map(k=>norm(data[k])).filter(Boolean);

async function main(){
  const source=await readFile("../js/firebase-client.js","utf8");
  const app=initializeApp(extractConfig(source),"drg-ownership-audit");
  try{
    const db=getFirestore(app);
    const [propertiesSnap,agentsSnap]=await Promise.all([getDocs(collection(db,"properties")),getDocs(collection(db,"agents"))]);
    const agents=agentsSnap.docs.map(doc=>({id:norm(doc.id),data:doc.data() as Record<string,unknown>}));
    const idSet=new Set<string>();
    const emailSet=new Set<string>();
    const nameSet=new Set<string>();
    for(const agent of agents){
      [agent.id,...values(agent.data,["uid","agentId","userId"])].filter(Boolean).forEach(v=>idSet.add(v));
      values(agent.data,["email","correo"]).forEach(v=>emailSet.add(v));
      values(agent.data,["name","nombre"]).forEach(v=>nameSet.add(v));
    }
    let strong=0,nameOnly=0,unmatched=0,legacyPublication=0,withAgentId=0,withEmail=0;
    for(const doc of propertiesSnap.docs){
      const data=doc.data() as Record<string,unknown>;
      const ids=values(data,["agentId","agenteId","ownerId","userId","createdBy"]);
      const emails=values(data,["agentEmail","email","createdByEmail","ownerEmail"]);
      const names=values(data,["agentName","agente","agent"]);
      if(ids.length) withAgentId++;
      if(emails.length) withEmail++;
      if(!("publicationStatus" in data) && !("publicVisible" in data)) legacyPublication++;
      const strongMatch=ids.some(v=>idSet.has(v))||emails.some(v=>emailSet.has(v));
      if(strongMatch) strong++;
      else if(names.some(v=>nameSet.has(v))) nameOnly++;
      else unmatched++;
    }
    console.log(JSON.stringify({
      propertyCount:propertiesSnap.size,
      agentCount:agentsSnap.size,
      ownership:{strong,nameOnly,unmatched,withAgentId,withEmail},
      publication:{legacyDocuments:legacyPublication}
    },null,2));
    if(unmatched>0) process.exitCode=2;
  }finally{await deleteApp(app)}
}
main().catch(error=>{console.error("[DRG ownership audit] failed",error);process.exitCode=1});
