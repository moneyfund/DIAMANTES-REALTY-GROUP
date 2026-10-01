import { Suspense } from "react";
import { ShareCompatibilityClient } from "@/components/shared/ShareCompatibilityClient";
export const metadata={title:"Selección privada | Diamantes Realty Group",robots:{index:false,follow:false,noarchive:true}};
export default function ShareCompatibilityPage(){return <Suspense fallback={<div className="drg-shared-state">Preparando enlace…</div>}><ShareCompatibilityClient/></Suspense>;}
