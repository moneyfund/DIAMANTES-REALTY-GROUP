import { collection, getDocs, limit, query } from "firebase/firestore";
import { getFirebaseClient } from "./client";
import { normalizeProperty } from "@/lib/properties/normalize";
import type { Property } from "@/types/property";

const COLLECTION = "properties";

export async function readProperties(max = 50): Promise<Property[]> {
  const firebase = getFirebaseClient();
  if (!firebase) return [];

  const snapshot = await getDocs(query(collection(firebase.db, COLLECTION), limit(Math.max(1, Math.min(max, 100)))));
  return snapshot.docs.map((doc) => normalizeProperty(doc.id, doc.data()));
}

// Stage 1 is intentionally read-only. Add write operations only after staging
// Firebase is isolated and the migration reaches the private/admin phase.
