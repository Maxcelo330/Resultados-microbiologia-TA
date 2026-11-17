// Guarda la app en el celular para que abra sin internet y muestra los avisos.
// Al cambiar index.html, sube la versión para que el celular descargue lo nuevo.
const CACHE = "micro-ta-v3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    e.respondWith(caches.open(CACHE).then(c => fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => c.match(e.request))));
    return;
  }
  // data.json siempre de la red (la app guarda su propia copia); el resto: red y, sin señal, lo guardado
  if (url.pathname.endsWith("/data.json")) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match("./index.html"))));
});
// Tocar un aviso abre (o enfoca) la app en la vista que corresponde
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const vista = (e.notification.data && e.notification.data.vista) || "dia";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { c.postMessage({ vista }); return c.focus(); }
    return self.clients.openWindow("./index.html#" + vista);
  }));
});
