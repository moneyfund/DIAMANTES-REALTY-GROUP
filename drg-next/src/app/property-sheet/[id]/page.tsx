import { PrivateGate } from "@/components/auth/PrivateGate";
import { PropertySheetClient } from "@/components/property-sheet/PropertySheetClient";

export const metadata={title:"Ficha técnica | Diamantes Realty Group",robots:{index:false,follow:false}};

export default async function PropertySheetPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <PrivateGate required="agent"><PropertySheetClient propertyId={id}/></PrivateGate>;
}
