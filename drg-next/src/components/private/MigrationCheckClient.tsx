"use client";

import { useState } from "react";
import Link from "next/link";
import { useDrgAuth } from "@/components/auth/AuthProvider";
import { drgDeploymentEnvironment, drgWritesEnabled } from "@/lib/config/writes";
import { runMigrationSmokeTest, type MigrationSmokeStep } from "@/lib/firebase/migration-smoke";

const baseSteps:MigrationSmokeStep[]=[
  ["property","Crear propiedad temporal"],
  ["read","Leer propiedad temporal"],
  ["update","Actualizar propiedad temporal"],
  ["comment","Crear comentario temporal"],
  ["review","Crear reseña temporal"],
  ["form","Crear formulario temporal"],
  ["list","Crear lista compartida temporal"],
  ["storage","Subir archivo temporal a Storage"],
  ["cleanup","Limpiar registros temporales"]
].map(([key,label])=>({key,label,status:"pending"}));

export function MigrationCheckClient(){
  const {profile}=useDrgAuth();
  const [steps,setSteps]=useState<MigrationSmokeStep[]>(baseSteps);
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState("");

  function updateStep(step:MigrationSmokeStep){
    setSteps(current=>current.map(item=>item.key===step.key?step:item));
  }

  async function run(){
    if(!profile.user)return;
    setSteps(baseSteps);setResult("");setRunning(true);
    try{
      const outcome=await runMigrationSmokeTest(profile.user,updateStep);
      setResult("Prueba completada y limpiada: "+outcome.id);
    }catch(error){
      setResult("Prueba detenida: "+(error instanceof Error?error.message:String(error)));
    }finally{setRunning(false)}
  }

  return <section className="drg-migration-check">
    <header><div><p className="drg-kicker">DRG 2.0 · Migración</p><h1>Prueba controlada de escritura</h1><p>Esta herramienta crea únicamente registros temporales identificados como MIGRATION TEST y luego los elimina.</p></div><Link href="/admin">Volver al Admin</Link></header>
    <div className="drg-migration-status"><article><small>Entorno Vercel</small><strong>{drgDeploymentEnvironment}</strong></article><article><small>Escrituras</small><strong>{drgWritesEnabled?"HABILITADAS":"BLOQUEADAS"}</strong></article><article><small>Cuenta</small><strong>{profile.user?.email||"—"}</strong></article></div>
    <div className="drg-migration-warning"><strong>No ejecutar antes del backup.</strong><p>Las reglas propuestas deben estar desplegadas y las variables de Preview deben estar activas. Producción permanece bloqueada por código.</p></div>
    <div className="drg-migration-steps">{steps.map(step=><article key={step.key} className={"is-"+step.status}><span>{step.status==="success"?"✓":step.status==="error"?"!":step.status==="running"?"…":"○"}</span><div><strong>{step.label}</strong>{step.detail?<small>{step.detail}</small>:null}</div></article>)}</div>
    <button className="drg-migration-run" disabled={running||!drgWritesEnabled} onClick={()=>void run()}>{running?"Ejecutando…":drgWritesEnabled?"Ejecutar prueba controlada":"Escrituras bloqueadas"}</button>
    {result?<p className="drg-migration-result">{result}</p>:null}
  </section>;
}
