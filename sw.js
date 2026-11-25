// Garde l'app sur le téléphone pour qu'elle s'ouvre sans réseau.
// Avec du réseau : on prend toujours la version en ligne (et on met la copie à jour).
// Sans réseau (ou réseau trop lent) : on sert la copie du téléphone.
const VERSION = 'carnet-v33';
const FILES = ['./', 'index.html', 'style.css', 'library.js', 'body.js', 'plan.js', 'models.js', 'journal.js', 'tools.js', 'chrono.js', 'nutri.js', 'me.js', 'extras.js', 'sync.js', 'desk.js', 'act.js', 'auth.js', 'social.js', 'gen.js', 'fileimport.js', 'push.js', 'app.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => r.ok && c.put(f, r)).catch(() => { })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const fromCache = async () => (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('index.html') || await cache.match('./') : null);
    try {
      const net = fetch(req, { cache: 'no-cache' });
      const res = await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('lent')), 3500))]);
      if (res && res.ok) { cache.put(req, res.clone()); return res; }
      return (await fromCache()) || res;
    } catch (err) {
      return (await fromCache()) || new Response('Hors ligne', { status: 503 });
    }
  })());
});

// Notification de fin de repos (envoyée par le serveur, même app fermée)
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let m = { title: '⏱️ Repos terminé', body: "C'est reparti pour ta série !" };
    try { const c = await caches.open('carnet-push'), r = await c.match('/__push_msg'); if (r) m = { ...m, ...(await r.json()) }; } catch (_) { }
    try { if (e.data) m = { ...m, ...e.data.json() }; } catch (_) { }
    await self.registration.showNotification(m.title, { body: m.body, tag: 'rest', renotify: true, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [300, 120, 300] });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => { const L = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); if (L.length) return L[0].focus(); return self.clients.openWindow('./'); })());
});
