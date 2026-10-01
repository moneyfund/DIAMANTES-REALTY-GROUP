import type { User } from "firebase/auth";
import type { Agent } from "@/types/agent";

export type DrgRole = "guest" | "client" | "agent" | "admin";

export type DrgAccessProfile = {
  role: DrgRole;
  authenticated: boolean;
  user: User | null;
  agent: Agent | null;
  source: "guest" | "admin-legacy" | "agent-document" | "agent-legacy" | "client";
};
