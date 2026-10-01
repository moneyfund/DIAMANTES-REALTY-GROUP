"use client";

import { useEffect } from "react";

export function AgentPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/agent-sw.js", { scope: "/" });
      } catch {
        // The dashboard remains fully usable in the browser if registration is unavailable.
      }
    };

    void register();
  }, []);

  return null;
}
