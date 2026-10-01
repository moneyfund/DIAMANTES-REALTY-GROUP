"use client";

import Link from "next/link";
import { canAccessPrivateRoute } from "@/lib/auth/access";
import { useDrgAuth } from "./AuthProvider";

export function PrivateGate({ required, children }: { required: "agent" | "admin"; children: React.ReactNode }) {
  const { loading, profile, signInWithGoogle, logout } = useDrgAuth();

  if (loading) return <section className="drg-private-state"><p>Verificando sesión…</p></section>;

  if (!profile.authenticated) {
    return <section className="drg-private-state"><p className="drg-kicker">Acceso privado</p><h1>Inicia sesión con Google</h1><p>Usa la cuenta autorizada para acceder a este panel.</p><button onClick={() => void signInWithGoogle()}>Ingresar con Google</button><Link href="/">Volver al sitio</Link></section>;
  }

  if (!canAccessPrivateRoute(profile, required)) {
    return <section className="drg-private-state"><p className="drg-kicker">Acceso restringido</p><h1>Esta cuenta no tiene permisos para este panel.</h1><p>Sesión iniciada como {profile.user?.email || "usuario autenticado"}.</p><button onClick={() => void logout()}>Cerrar sesión</button><Link href="/">Volver al sitio</Link></section>;
  }

  return <>{children}</>;
}
