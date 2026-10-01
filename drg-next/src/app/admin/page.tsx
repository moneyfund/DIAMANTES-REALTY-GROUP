import { PrivateGate } from "@/components/auth/PrivateGate";
import { AdminReadOnlyDashboard } from "@/components/private/AdminReadOnlyDashboard";

export const metadata={title:"Administración | DRG 2.0",robots:{index:false,follow:false}};

export default function AdminPage(){return <main className="drg-private-page"><PrivateGate required="admin"><AdminReadOnlyDashboard/></PrivateGate></main>;}
