// PlantPal service worker — offline app shell.
// Web Push handlers are added in Plan 2.
//
// Strategy: network-first so a new deploy always reaches the browser, with a
// cached fallback for offline. The previous version was cache-first with a
// fixed cache name, which pinned the very first HTML/JS a browser ever loaded
// and silently hid every later deploy (e.g. the photo-identify feature).
const CACHE = "plantpal-shell-v2";
const PRECACHE = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  // Drop every older cache (incl. plantpal-shell-v1 full of stale HTML/JS).
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network-first: serve the freshest response, cache it, and fall back to the
  // cache (or the app shell for navigations) only when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((cached) => cached || caches.match("/")),
      ),
  );
});
