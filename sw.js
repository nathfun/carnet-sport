// Garde l'app sur le téléphone pour qu'elle s'ouvre sans réseau.
// Change VERSION à chaque mise à jour de l'app.
const VERSION = 'carnet-v9';
const FILES = ['./', 'index.html', 'style.css', 'library.js', 'body.js', 'plan.js', 'models.js', 'journal.js', 'tools.js', 'me.js', 'app.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Fichiers de l'app : on sert la copie du téléphone tout de suite, et on la rafraîchit en fond si le réseau répond.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('Hors ligne', { status: 503 });
  }));
});
