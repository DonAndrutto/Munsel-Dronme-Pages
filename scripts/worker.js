const cachePrefix = 'munsel-dronme-';
const cacheName = cachePrefix + '__VERSION__';
const files = __FILES__;
const scope = self.registration.scope;
const reader = new URL('index.html', scope).href;
const resources = new Set(Object.keys(files).map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  // Install the complete release together, including fonts for hidden text layers.
  const requests = Object.entries(files).map(([path, integrity]) =>
    new Request(new URL(path, scope), { integrity, cache: 'reload' })
  );
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(requests)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  let key = url.href;
  if (request.mode === 'navigate' && key === scope) key = reader;
  if (!resources.has(key)) return;
  event.respondWith(caches.open(cacheName).then(async cache => await cache.match(key) || fetch(request)));
});
