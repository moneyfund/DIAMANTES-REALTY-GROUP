import { SharedListClient } from "@/components/shared/SharedListClient";
export const metadata={title:"Selección privada | Diamantes Realty Group",robots:{index:false,follow:false,noarchive:true}};
export default async function SharedListPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <SharedListClient token={decodeURIComponent(token)}/>;}
