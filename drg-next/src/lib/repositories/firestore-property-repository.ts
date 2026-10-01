import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { normalizeProperty } from "@/lib/properties/normalize";
import { PUBLIC_PROPERTIES_COLLECTION } from "@/lib/properties/constants";
import type { PropertyRepository, PropertyListResult } from "./property-repository";
import type { Property } from "@/types/property";

export class FirestorePropertyRepository implements PropertyRepository {
  async listPublic(max = 100): Promise<PropertyListResult> {
    const firebase = getFirebaseClient();
    if (!firebase) return { properties: [], sourceCount: 0, publicCount: 0 };

    const snapshot = await getDocs(
      query(
        collection(firebase.db, PUBLIC_PROPERTIES_COLLECTION),
        limit(Math.max(1, Math.min(max, 200)))
      )
    );

    const normalized = snapshot.docs.map((document) =>
      normalizeProperty(document.id, document.data())
    );
    const properties = normalized.filter((property) => property.publicVisible);

    return {
      properties,
      sourceCount: normalized.length,
      publicCount: properties.length
    };
  }

  async getById(id: string): Promise<Property | null> {
    const firebase = getFirebaseClient();
    if (!firebase || !id) return null;

    const snapshot = await getDoc(doc(firebase.db, PUBLIC_PROPERTIES_COLLECTION, id));
    if (!snapshot.exists()) return null;

    const property = normalizeProperty(snapshot.id, snapshot.data());
    return property.publicVisible ? property : null;
  }
}
