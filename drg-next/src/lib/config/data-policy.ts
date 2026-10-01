import { drgDataMode } from "./env";

export type DataCapability = "read" | "write";

export function canReadData() {
  return drgDataMode !== "disabled";
}

export function canWriteData() {
  const environment = process.env.DRG_DEPLOYMENT_ENV ?? "development";
  const branch = process.env.DRG_DEPLOYMENT_BRANCH ?? "";
  const flag = process.env.NEXT_PUBLIC_DRG_ALLOW_WRITES === "true";

  const preview =
    environment === "preview" &&
    branch === "migration/drg-next" &&
    drgDataMode === "staging";

  const production =
    environment === "production" &&
    branch === "main" &&
    drgDataMode === "production";

  return flag && (preview || production);
}

export function assertDataCapability(capability: DataCapability) {
  if (capability === "read" && !canReadData()) {
    throw new Error("DRG data access is disabled in this environment.");
  }

  if (capability === "write" && !canWriteData()) {
    throw new Error("DRG write access is blocked in this environment.");
  }
}
