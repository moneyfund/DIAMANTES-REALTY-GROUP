import type { PropertyRepository, PropertyListResult } from "./property-repository";

export class DisabledPropertyRepository implements PropertyRepository {
  async listPublic(): Promise<PropertyListResult> {
    return { properties: [], sourceCount: 0, publicCount: 0 };
  }

  async getById(): Promise<null> {
    return null;
  }
}
