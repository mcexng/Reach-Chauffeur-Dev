const CACHE_NAME = 'reach-chauffeur-v1';

// Install event - caching basic offline shell (optional but recommended for PWA)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event - network falling back to cache
self.addEventListener('fetch', (event) => {
  // Let the browser handle fetches by default
  // This simple worker is just enough to trigger the "Add to Home Screen" prompt!
});
