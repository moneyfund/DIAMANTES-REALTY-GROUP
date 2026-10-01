import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { normalizeAgent } from "@/lib/agents/normalize";
import type { Agent } from "@/types/agent";

export async function readAgents(): Promise<Agent[]> {
  const firebase = getFirebaseClient();
  if (!firebase) return [];
  const snapshot = await getDocs(collection(firebase.db, "agents"));
  return snapshot.docs
    .map((entry) => normalizeAgent(entry.id, entry.data()))
    .filter((agent) => agent.active);
}

export async function readAgentById(id: string): Promise<Agent | null> {
  const firebase = getFirebaseClient();
  if (!firebase || !id) return null;
  const snapshot = await getDoc(doc(firebase.db, "agents", id));
  if (!snapshot.exists()) return null;
  const agent = normalizeAgent(snapshot.id, snapshot.data());
  return agent.active ? agent : null;
}
