import { drgDataMode } from "./env";

export const drgDeploymentEnvironment =
  process.env.DRG_DEPLOYMENT_ENV ?? "development";

export const drgWritesEnabled =
  drgDeploymentEnvironment === "preview" &&
  process.env.NEXT_PUBLIC_DRG_ALLOW_WRITES === "true" &&
  drgDataMode === "staging";

export function assertDrgWritesEnabled() {
  if (!drgWritesEnabled) {
    throw new Error("Las escrituras de DRG 2.0 están bloqueadas en este entorno.");
  }
}
