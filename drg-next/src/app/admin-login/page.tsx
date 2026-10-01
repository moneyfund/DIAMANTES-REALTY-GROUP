"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDrgAuth } from "@/components/auth/AuthProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loading, profile, signInWithGoogle, logout } = useDrgAuth();

  useEffect(() => {
    if (!loading && profile.role === "admin") router.replace("/admin");
  }, [loading, profile.role, router]);

  return (
    <main className="drg-login-page">
      <section className="drg-login-card">
        <p className="drg-kicker">Diamantes Realty Group</p>
        <h1>Administración</h1>
        <p>Acceso privado para cuentas administrativas autorizadas.</p>
        {loading ? <span>Verificando sesión…</span> : profile.authenticated && profile.role !== "admin" ? (
          <><p className="is-error">La cuenta actual no tiene permisos administrativos.</p><button onClick={() => void logout()}>Cerrar sesión</button></>
        ) : <button onClick={() => void signInWithGoogle()}>Ingresar con Google</button>}
      </section>
    </main>
  );
}
