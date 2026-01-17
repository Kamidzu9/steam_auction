const CACHE_NAME = 'steam-auction-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  // Skip requests from non-http(s) schemes (chrome-extension://, moz-extension://, etc.)
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (!res || res.status !== 200) return res;

          // Only attempt to cache http(s) GET responses. Some responses may be 'opaque' (cross-origin);
          // attempt to cache those too but guard against unsupported request schemes when putting.
          const cloned = res.clone();
          caches.open(CACHE_NAME).then(async (cache) => {
            try {
              await cache.put(event.request, cloned);
            } catch (err) {
              // Ignore put errors (e.g., unsupported scheme or opaque responses)
              console.warn('[sw] cache.put failed for', event.request.url, err);
            }
          });

          return res;
        })
        .catch(() => caches.match('/'));
    })
  );
});