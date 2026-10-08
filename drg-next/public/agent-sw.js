const DRG_AGENT_SW_VERSION = "drg-agents-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // This service worker belongs only to the authenticated agent workspace.
  // Never intercept public property pages, the public catalog, home or APIs.
  const isAgentWorkspace =
    url.pathname === "/agent-dashboard" ||
    url.pathname.startsWith("/agent-dashboard/");

  if (!isAgentWorkspace) return;

  // Network-only by design: private Firebase-backed data must never be cached.
  event.respondWith(fetch(request));
});
