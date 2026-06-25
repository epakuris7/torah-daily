// Torah Daily – Service Worker
// Caches the app shell + all Torah data for full offline use

const CACHE = 'torah-daily-v3';

const DATA_FILES = [
  'Bereshit','Noach','Lech-Lecha','Vayera','Chayei-Sara','Toldot',
  'Vayetzei','Vayishlach','Vayeshev','Miketz','Vayigash','Vayechi',
  'Shemot','Vaera','Bo','Beshalach','Yitro','Mishpatim','Terumah',
  'Tetzaveh','Ki-Tisa','Vayakhel','Pekudei',
  'Vayikra','Tzav','Shmini','Tazria','Metzora','Achrei-Mot','Kedoshim',
  'Emor','Behar','Bechukotai',
  'Bamidbar','Nasso','Behaalotcha','Shlach','Korach','Chukat','Balak',
  'Pinchas','Matot','Masei',
  'Devarim','Vaetchanan','Eikev','Reeh','Shoftim','Ki-Teitzei','Ki-Tavo',
  'Nitzavim','Vayeilech','Haazinu','VZot-HaBerachah',
].map(id => `./data/${id}.json`);

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Frank+Ruhl+Libre:wght@300;400;500&family=Inter:wght@300;400;500&display=swap',
  ...DATA_FILES,
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cache-first for local Torah data files (pre-downloaded JSON)
  if (url.pathname.startsWith('/data/') && url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
      })
    );
    return;
  }

  // Network-first for Sefaria API and Claude API (always fresh)
  if (url.hostname === 'www.sefaria.org' || url.hostname === 'api.anthropic.com') {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for everything else (app shell, fonts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
