import { Suspense } from "react";
import { SharePropertyQueryClient } from "@/components/shared/SharePropertyQueryClient";
export const metadata={title:"Propiedad seleccionada | Diamantes Realty Group",robots:{index:false,follow:false,noarchive:true}};
export default function SharedPropertyPage(){return <Suspense fallback={<div className="drg-shared-state">Preparando propiedad…</div>}><SharePropertyQueryClient/></Suspense>;}
