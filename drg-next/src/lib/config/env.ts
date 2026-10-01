import { firebaseProductionPublicConfig } from "./firebase-production-public";

export type DrgDataMode = "disabled" | "readonly" | "staging" | "production";

const rawMode = process.env.NEXT_PUBLIC_DRG_DATA_MODE;
export const drgDataMode: DrgDataMode =
  rawMode === "readonly" || rawMode === "staging" || rawMode === "production"
    ? rawMode
    : "disabled";

export const firebasePublicConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseProductionPublicConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseProductionPublicConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseProductionPublicConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseProductionPublicConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseProductionPublicConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseProductionPublicConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseProductionPublicConfig.measurementId
};

export function hasFirebasePublicConfig() {
  return Boolean(
    firebasePublicConfig.apiKey &&
    firebasePublicConfig.authDomain &&
    firebasePublicConfig.projectId &&
    firebasePublicConfig.storageBucket &&
    firebasePublicConfig.messagingSenderId &&
    firebasePublicConfig.appId
  );
}
