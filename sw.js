// Ericair — service worker: velocizza le aperture successive.
// - librerie e font con versione nell'indirizzo (gstatic, cdnjs, Google Fonts): prima dalla cache
// - pagine dell'app: prima la rete (così si ha sempre l'ultima versione), cache solo se non c'è connessione
// I dati dei clienti (Firestore) NON passano di qui.
const CACHE = 'ericair-v1';
const HOST_CACHE_FIRST = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (HOST_CACHE_FIRST.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(cache => cache.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin === self.location.origin && (req.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/'))) {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req)));
  }
});
