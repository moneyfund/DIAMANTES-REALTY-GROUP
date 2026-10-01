import { collection, getDocs, limit, query } from "firebase/firestore";
import { getFirebaseClient } from "./client";
import { normalizeProperty } from "@/lib/properties/normalize";
import { PUBLIC_PROPERTIES_COLLECTION } from "@/lib/properties/constants";
import type { Property } from "@/types/property";

export type PropertyReadResult = {
  properties: Property[];
  sourceCount: number;
  publicCount: number;
};

export async function readProperties(max = 100): Promise<PropertyReadResult> {
  const firebase = getFirebaseClient();

  if (!firebase) {
    return { properties: [], sourceCount: 0, publicCount: 0 };
  }

  const snapshot = await getDocs(
    query(
      collection(firebase.db, PUBLIC_PROPERTIES_COLLECTION),
      limit(Math.max(1, Math.min(max, 200)))
    )
  );

  const normalized = snapshot.docs.map((document) =>
    normalizeProperty(document.id, document.data())
  );

  const publicProperties = normalized.filter((property) => property.publicVisible);

  return {
    properties: publicProperties,
    sourceCount: normalized.length,
    publicCount: publicProperties.length
  };
}

// Stage 1 remains intentionally read-only. No add/update/delete exports exist here.
