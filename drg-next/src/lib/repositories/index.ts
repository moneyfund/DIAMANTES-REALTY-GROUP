import { drgDataMode } from "@/lib/config/env";
import { DisabledPropertyRepository } from "./disabled-property-repository";
import { FirestorePropertyRepository } from "./firestore-property-repository";
import type { PropertyRepository } from "./property-repository";

let propertyRepository: PropertyRepository | null = null;

export function getPropertyRepository(): PropertyRepository {
  if (propertyRepository) return propertyRepository;

  propertyRepository =
    drgDataMode === "disabled"
      ? new DisabledPropertyRepository()
      : new FirestorePropertyRepository();

  return propertyRepository;
}
