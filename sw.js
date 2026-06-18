/* Service worker del Tablero KS
   Estrategia: red primero, con copia en caché como respaldo.
   Así siempre te llevás la última versión del repo, pero si no hay
   internet la app abre igual con lo último que vio. */
const CACHE = 'tablero-ks-v13';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
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
  // Solo manejamos GET del mismo origen; Firebase y CDNs pasan directo
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Para el HTML: saltear el caché HTTP así cada deploy se ve al instante
  const esNavegacion = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  e.respondWith(
    fetch(e.request, esNavegacion ? { cache: 'no-cache' } : undefined)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
