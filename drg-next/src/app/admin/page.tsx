import { PrivateGate } from "@/components/auth/PrivateGate";
import { AdminDashboard } from "@/components/private/AdminDashboard";

export const metadata={title:"Administración | DRG 2.0",robots:{index:false,follow:false}};

export default function AdminPage(){return <main className="drg-admin-dashboard-page"><PrivateGate required="admin"><AdminDashboard/></PrivateGate></main>;}
