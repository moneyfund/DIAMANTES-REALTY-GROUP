import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { drgDataMode, firebasePublicConfig, hasFirebasePublicConfig } from "@/lib/config/env";

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

let client: FirebaseClient | null = null;

export function getFirebaseClient(): FirebaseClient | null {
  if (client) return client;
  if (drgDataMode === "disabled" || !hasFirebasePublicConfig()) return null;

  const app = getApps().length ? getApp() : initializeApp(firebasePublicConfig);
  client = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app)
  };

  return client;
}
