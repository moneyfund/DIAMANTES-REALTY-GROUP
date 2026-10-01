import type { Property } from "@/types/property";

export type PropertyListResult = {
  properties: Property[];
  sourceCount: number;
  publicCount: number;
};

export interface PropertyRepository {
  listPublic(max?: number): Promise<PropertyListResult>;
  getById(id: string): Promise<Property | null>;
}
