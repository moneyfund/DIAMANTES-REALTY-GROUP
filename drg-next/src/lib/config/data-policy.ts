import { drgDataMode } from "./env";

export type DataCapability = "read" | "write";

export function canReadData() {
  return drgDataMode !== "disabled";
}

export function canWriteData() {
  return drgDataMode === "staging" || drgDataMode === "production";
}

export function assertDataCapability(capability: DataCapability) {
  if (capability === "read" && !canReadData()) {
    throw new Error("DRG data access is disabled in this environment.");
  }

  if (capability === "write" && !canWriteData()) {
    throw new Error("DRG write access is blocked in this environment.");
  }
}
