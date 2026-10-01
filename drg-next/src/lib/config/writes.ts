import { drgDataMode } from "./env";

export const drgWritesEnabled =
  process.env.NEXT_PUBLIC_DRG_ALLOW_WRITES === "true" &&
  (drgDataMode === "staging" || drgDataMode === "production");

export function assertDrgWritesEnabled() {
  if (!drgWritesEnabled) {
    throw new Error("Las escrituras de DRG 2.0 están bloqueadas en este entorno.");
  }
}
