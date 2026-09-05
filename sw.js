/* ============================================================
   LifePilot — Service Worker
   Cache-First for static app assets (HTML/CSS/JS/icons/fonts).
   Network-First for anything else (weather API, deep-link targets),
   falling back to cache only if the network genuinely fails.
   ============================================================ */

const CACHE_NAME = 'lifepilot-v2-cache-1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/orchestrator.js',
  './js/orchestrator_compose.js',
  './js/memory.js',
  './js/perception.js',
  './js/storage.js',
  './js/i18n.js',
  './js/ui.js',
  './js/ui_cards.js',
  './js/ui_screens.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = url.origin === self.location.origin;

  if (isStaticAsset) {
    // Cache-First for our own app shell
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      }).catch(() => cached))
    );
  } else {
    // Network-First for everything else (weather API, CDN scripts, deep links)
    event.respondWith(
      fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(event.request))
    );
  }
});
