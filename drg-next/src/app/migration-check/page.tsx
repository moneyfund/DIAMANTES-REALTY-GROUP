import { PrivateGate } from "@/components/auth/PrivateGate";
import { MigrationCheckClient } from "@/components/private/MigrationCheckClient";

export const metadata={title:"Migration Check | DRG 2.0",robots:{index:false,follow:false,noarchive:true}};

export default function MigrationCheckPage(){
  return <main className="drg-admin-dashboard-page"><PrivateGate required="admin"><MigrationCheckClient/></PrivateGate></main>;
}
