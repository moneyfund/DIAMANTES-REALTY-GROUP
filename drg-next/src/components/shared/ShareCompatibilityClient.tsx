"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ShareCompatibilityClient(){
  const router=useRouter();const params=useSearchParams();
  useEffect(()=>{const token=params.get("token")?.trim();if(token)router.replace("/share/"+encodeURIComponent(token))},[router,params]);
  return <div className="drg-shared-state"><p className="drg-kicker">Selección privada</p><h1>Preparando enlace…</h1></div>;
}
