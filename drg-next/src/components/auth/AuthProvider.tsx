"use client";

import { browserLocalPersistence, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { resolveAccessProfile } from "@/lib/auth/access";
import type { DrgAccessProfile } from "@/lib/auth/types";

type AuthContextValue = {
  loading: boolean;
  profile: DrgAccessProfile;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const guest: DrgAccessProfile = { role: "guest", authenticated: false, user: null, agent: null, source: "guest" };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DrgAccessProfile>(guest);
  const [authUser, setAuthUser] = useState<User | null>(null);

  const refreshFor = useCallback(async (user: User | null) => {
    const resolved = await resolveAccessProfile(user);
    setProfile(resolved);
    setLoading(false);
  }, []);

  useEffect(() => {
    const firebase = getFirebaseClient();
    if (!firebase) { setLoading(false); return; }

    let unsubscribe = () => {};
    void setPersistence(firebase.auth, browserLocalPersistence)
      .catch((error) => console.warn("[DRG auth] local persistence unavailable", error))
      .finally(() => {
        unsubscribe = onAuthStateChanged(firebase.auth, (user) => {
          setAuthUser(user);
          setLoading(true);
          void refreshFor(user);
        });
      });

    return () => unsubscribe();
  }, [refreshFor]);

  const signInWithGoogle = useCallback(async () => {
    const firebase = getFirebaseClient();
    if (!firebase) throw new Error("Firebase Auth no está disponible.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(firebase.auth, provider);
  }, []);

  const logout = useCallback(async () => {
    const firebase = getFirebaseClient();
    if (!firebase) return;
    await signOut(firebase.auth);
  }, []);

  const refresh = useCallback(async () => refreshFor(authUser), [authUser, refreshFor]);

  const value = useMemo(() => ({ loading, profile, signInWithGoogle, logout, refresh }), [loading, profile, signInWithGoogle, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDrgAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useDrgAuth must be used inside AuthProvider.");
  return context;
}
