import { drgDataMode } from "./env";

export const drgDeploymentEnvironment =
  process.env.DRG_DEPLOYMENT_ENV ?? "development";

export const drgDeploymentBranch =
  process.env.DRG_DEPLOYMENT_BRANCH ?? "";

const migrationPreviewWrites =
  drgDeploymentEnvironment === "preview" &&
  drgDeploymentBranch === "migration/drg-next" &&
  drgDataMode === "staging";

const productionMainWrites =
  drgDeploymentEnvironment === "production" &&
  drgDeploymentBranch === "main" &&
  drgDataMode === "production";

export const drgWritesEnabled =
  process.env.NEXT_PUBLIC_DRG_ALLOW_WRITES === "true" &&
  (migrationPreviewWrites || productionMainWrites);

export function assertDrgWritesEnabled() {
  if (!drgWritesEnabled) {
    throw new Error("Las escrituras de DRG 2.0 están bloqueadas en este entorno.");
  }
}
