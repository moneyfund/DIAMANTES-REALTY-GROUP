import { PrivateGate } from "@/components/auth/PrivateGate";
import { AgentReadOnlyDashboard } from "@/components/private/AgentReadOnlyDashboard";

export const metadata={title:"Panel de agente | DRG 2.0",robots:{index:false,follow:false}};

export default function AgentDashboardPage(){return <main className="drg-private-page"><PrivateGate required="agent"><AgentReadOnlyDashboard/></PrivateGate></main>;}
