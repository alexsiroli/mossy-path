self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  clients.claim();
});

self.addEventListener('fetch', (e) => {
  // network first then fallback to cache
}); 