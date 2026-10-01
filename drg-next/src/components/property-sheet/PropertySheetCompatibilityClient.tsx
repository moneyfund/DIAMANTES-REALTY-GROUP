"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PropertySheetCompatibilityClient(){
  const router=useRouter(); const search=useSearchParams();
  useEffect(()=>{
    let id=search.get("id")||search.get("propertyId")||"";
    if(!id&&typeof window!=="undefined"){
      const parts=window.location.hash.replace(/^#/,"").split("/").filter(Boolean);
      const index=parts.indexOf("property-sheet");
      if(index>=0)id=decodeURIComponent(parts[index+1]||"");
    }
    if(id)router.replace("/property-sheet/"+encodeURIComponent(id));
  },[router,search]);
  return <div className="drg-sheet-state">Preparando ficha técnica…</div>;
}
