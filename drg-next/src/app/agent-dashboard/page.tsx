import { PrivateGate } from "@/components/auth/PrivateGate";
import { AgentDashboard } from "@/components/private/AgentDashboard";

export const metadata={title:"Panel de agente | DRG 2.0",robots:{index:false,follow:false}};

export default function AgentDashboardPage(){return <main className="drg-agent-dashboard-page"><PrivateGate required="agent"><AgentDashboard/></PrivateGate></main>;}
