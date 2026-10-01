import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";
import { normalizeAgent } from "@/lib/agents/normalize";
import { LEGACY_ADMIN_EMAILS, LEGACY_AGENT_EMAILS } from "./legacy-access";
import type { DrgAccessProfile } from "./types";

function normalizedEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function resolveAccessProfile(user: User | null): Promise<DrgAccessProfile> {
  if (!user) return { role: "guest", authenticated: false, user: null, agent: null, source: "guest" };

  const email = normalizedEmail(user.email);
  if (email && LEGACY_ADMIN_EMAILS.includes(email as (typeof LEGACY_ADMIN_EMAILS)[number])) {
    return { role: "admin", authenticated: true, user, agent: null, source: "admin-legacy" };
  }

  const firebase = getFirebaseClient();
  if (firebase) {
    const candidates = new Map<string, Record<string, unknown>>();

    const addDoc = (id: string, data: Record<string, unknown>) => {
      if (!candidates.has(id)) candidates.set(id, data);
    };

    try {
      const byUid = await getDoc(doc(firebase.db, "agents", user.uid));
      if (byUid.exists()) addDoc(byUid.id, byUid.data());
    } catch {}

    if (user.email) {
      try {
        const byEmail = await getDocs(query(collection(firebase.db, "agents"), where("email", "==", user.email)));
        byEmail.docs.forEach((entry) => addDoc(entry.id, entry.data()));
      } catch {}
    }

    try {
      const byUidField = await getDocs(query(collection(firebase.db, "agents"), where("uid", "==", user.uid)));
      byUidField.docs.forEach((entry) => addDoc(entry.id, entry.data()));
    } catch {}

    const matches = [...candidates.entries()].map(([id, data]) => normalizeAgent(id, data));
    const selected =
      matches.find((agent) => normalizedEmail(agent.email) === email) ||
      matches.find((agent) => agent.id === user.uid) ||
      matches[0] ||
      null;

    if (selected?.active) {
      return { role: "agent", authenticated: true, user, agent: selected, source: "agent-document" };
    }
  }

  if (email && LEGACY_AGENT_EMAILS.includes(email as (typeof LEGACY_AGENT_EMAILS)[number])) {
    return { role: "agent", authenticated: true, user, agent: null, source: "agent-legacy" };
  }

  return { role: "client", authenticated: true, user, agent: null, source: "client" };
}

export function canAccessPrivateRoute(profile: DrgAccessProfile, required: "agent" | "admin") {
  if (required === "admin") return profile.role === "admin";
  return profile.role === "agent" || profile.role === "admin";
}
