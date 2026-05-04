// sw.js — service worker para PWA
// Estrategia: network-first para HTML/CSS/JS (que tomes cambios al recargar online),
// cache-first para assets estáticos (íconos, fuentes). Fallback al cache si no hay red.

const VERSION = 'v9';
const CACHE = `dashboard-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/supabase-client.js',
  './js/auth.js',
  './js/sync.js',
  './js/calendar.js',
  './js/ideas.js',
  './js/reservas.js',
  './js/hoy.js',
  './js/metricas.js',
  './js/app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Fonts y otros third-party: cache-first sin bloquear
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
              return res;
            })
            .catch(() => cached)
      )
    );
    return;
  }

  // Mismo origen: network-first (intenta red, fallback a cache)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
