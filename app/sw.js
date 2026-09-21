/* Agora — service worker
   Coquille de l'app en cache + contenus consultés disponibles hors connexion. */

const VERSION = 'agora-v2';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';

const PRECACHE = [
  '/app/',
  '/app/app.css?v=2',
  '/app/app.js?v=2',
  '/app/manifest.webmanifest',
  '/app/icon-192.png',
  '/app/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isAudio(req, url) {
  return req.destination === 'audio' ||
    /\.(mp3|m4a|wav|ogg|oga)$/i.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // L'audio utilise des requêtes Range : on laisse le navigateur gérer.
  if (isAudio(req, url)) return;

  // Navigation → réseau d'abord, coquille en secours (hors connexion).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put('/app/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/app/', { ignoreSearch: true })
          .then(r => r || caches.match('/app/')))
    );
    return;
  }

  // Polices Google : cache d'abord (elles ne changent pas).
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Assets same-origin → stale-while-revalidate.
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
