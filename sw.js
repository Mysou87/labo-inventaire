// Service worker minimal : rend l'app installable sur l'écran d'accueil.
// Réseau d'abord (on voit toujours la dernière version), copie locale seulement hors ligne.
// Les données (Supabase, autre domaine) ne passent pas par ici.
const CACHE = 'labo-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request)),
  );
});
