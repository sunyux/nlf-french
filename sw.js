// Offline support: the whole site is cached the first time it loads, so it also works without signal.
// Network first (so a new version shows up as soon as you are online), cached copy as the fallback.
const CACHE = 'pawsitive-v1';
const PRECACHE = [
  './', 'index.html', 'style.css', 'print.css', 'puppy.css', 'app.js', 'i18n.js', 'dys.js', 'focus.js', 'typewriter.js',
  'numbers.js', 'verbs-dict.js', 'journal-prompts.js', 'nlf-data.js', 'nlf-a2.js', 'nlf-b.js', 'firebase-config.js',
  'manifest.webmanifest', 'img/icons/icon-192.png', 'img/icons/icon-512.png', 'img/icons/apple-touch-icon.png',
  'img/pup/accent.webp', 'img/pup/bar-head.webp', 'img/pup/bar-tail.webp', 'img/pup/complete.webp', 'img/pup/correct.webp', 'img/pup/hint.webp', 'img/pup/journal.webp', 'img/pup/level-a1.webp', 'img/pup/level-a2.webp', 'img/pup/level-b1.webp', 'img/pup/level-b2.webp', 'img/pup/level-c1.webp', 'img/pup/level-c2.webp', 'img/pup/listen.webp', 'img/pup/mistakes.webp', 'img/pup/search.webp', 'img/pup/sleep.webp', 'img/pup/spin.webp', 'img/pup/star.webp', 'img/pup/write.webp', 'img/pup/wrong.webp',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const cdn = /(^|\.)(gstatic\.com|googleapis\.com)$/.test(url.hostname);
  if (!sameOrigin && !cdn) return;                       // translation / Firebase API calls go straight to the network
  if (/firestore\.googleapis\.com|identitytoolkit|securetoken/.test(url.hostname + url.pathname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = await fetch(req);
      if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone());
      return net;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: false }) || await cache.match(req, { ignoreSearch: true })
        || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      if (hit) return hit;
      throw new Error('offline');
    }
  })());
});
