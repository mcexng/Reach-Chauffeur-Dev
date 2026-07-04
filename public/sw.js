// Basic Service Worker to pass PWA installation criteria
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching to avoid stale content
  event.respondWith(fetch(event.request));
});
