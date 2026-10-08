"use client";

import { useEffect } from "react";

export function AgentPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        // Older DRG builds registered agent-sw.js with "/" scope, which made
        // it intercept public property pages too. Remove only that obsolete
        // DRG registration before installing the dashboard-scoped worker.
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(async (registration) => {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            "";
          const rootScope = new URL("/", window.location.origin).href;
          if (scriptUrl.includes("/agent-sw.js") && registration.scope === rootScope) {
            await registration.unregister();
          }
        }));

        await navigator.serviceWorker.register("/agent-sw.js", {
          scope: "/agent-dashboard/",
          updateViaCache: "none",
        });
      } catch {
        // The dashboard remains fully usable in the browser if registration is unavailable.
      }
    };

    void register();
  }, []);

  return null;
}
