const CACHE_NAME = 'v1';
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
];

// Install the service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch the cached assets
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
