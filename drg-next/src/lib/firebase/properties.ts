import { getPropertyRepository } from "@/lib/repositories";
import type { PropertyListResult } from "@/lib/repositories/property-repository";
import type { Property } from "@/types/property";

export async function readProperties(max = 100): Promise<PropertyListResult> {
  return getPropertyRepository().listPublic(max);
}

export async function readPropertyById(id: string): Promise<Property | null> {
  return getPropertyRepository().getById(id);
}

// Compatibility facade only. No write methods are exported during the migration foundation.
