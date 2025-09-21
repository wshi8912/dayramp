// Minimal service worker: keeps shell available when cached
const CACHE_NAME = 'daykickoff-shell-v1';
const ASSETS = [
  '/',
  '/breathing-timer',
  '/focus-timer',
  '/interval-timer',
  '/privacy',
  '/terms',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((res) => res || caches.match('/')))
  );
});
