"use client";
import { useSearchParams } from "next/navigation";
import { SharedPropertyClient } from "./SharedPropertyClient";
export function SharePropertyQueryClient(){
  const params=useSearchParams();const token=params.get("token")||"";const propertyId=params.get("propertyId")||"";
  if(!token||!propertyId)return <div className="drg-shared-state"><p className="drg-kicker">Ficha privada</p><h1>Enlace incompleto</h1></div>;
  return <SharedPropertyClient token={token} propertyId={propertyId}/>;
}
