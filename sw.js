const CACHE = "runclub-v2";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-180.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname.includes("routing.openstreetmap.de")) return; // always live
  if (u.hostname === "tile.openstreetmap.org") {             // tiles: cache as you go, for weak signal
    e.respondWith(caches.open("runclub-tiles").then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // app shell: network first so updates land, cache fallback offline
  e.respondWith(fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || SHELL.includes(e.request.url))) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
    .catch(() => caches.match(e.request)));
});
