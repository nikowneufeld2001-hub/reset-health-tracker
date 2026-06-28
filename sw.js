const CACHE_NAMES = [
  "reset-health-tracker-v1",
  "reset-health-tracker-v2",
  "reset-health-tracker-v3",
  "reset-health-tracker-v4",
  "reset-health-tracker-v5",
  "reset-health-tracker-v6",
  "reset-health-tracker-v7",
  "reset-health-tracker-v8",
  "reset-health-tracker-v9",
  "reset-health-tracker-v10",
  "reset-life-dashboard-v1"
];

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.resolve());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => CACHE_NAMES.includes(key) || key.startsWith("reset-")).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener("fetch", () => {});
