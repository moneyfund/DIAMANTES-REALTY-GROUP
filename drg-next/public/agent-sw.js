const DRG_AGENT_SW_VERSION = "drg-agents-v1";

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

  // Network-only by design: the authenticated dashboard must always reflect
  // the current Firebase data and the latest deployed UI.
  event.respondWith(fetch(request));
});
