// sw.js
const CACHE_STATIC = 'clima-tv-static-v5';
const CACHE_DYNAMIC = 'clima-tv-dynamic-v5';
// Recursos estaticos: se cachean en la instalacion
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/weather.js',
    '/js/navigation.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/assets/posters/clear.jpg',
    '/assets/posters/cloudy.jpg',
    '/assets/posters/rain.jpg',
    '/assets/posters/thunder.jpg',
];
// ── Instalacion: cachear estaticos ────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});
// ── Activacion: limpiar caches viejos ─────────────────────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});
// ── Fetch: estrategia segun tipo de recurso ────────────────
self.addEventListener('fetch', e => {
    const { request } = e;
    const url = new URL(request.url);
    
    // Ignorar esquemas no soportados (como chrome-extension)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    // Videos: saltar el service worker para que el navegador maneje las peticiones de rango (Range) de forma nativa
    if (request.url.includes('/assets/videos/')) {
        return;
    }

    // API de clima: Network First (datos frescos)
    if (url.hostname === 'api.openweathermap.org') {
        e.respondWith(networkFirst(request));
        return;
    }
    // Todo lo demas: Cache First (estaticos)
    e.respondWith(cacheFirst(request));
});
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    // Solo cachear si es una respuesta completa/exitosa (200), ya que las respuestas parciales (206) no se pueden almacenar en caché
    if (response.status === 200) {
        const cache = await caches.open(CACHE_DYNAMIC);
        cache.put(request, response.clone());
    }
    return response;
}
async function networkFirst(request) {
    try {
        const response = await fetch(request,
            { signal: AbortSignal.timeout(5000) });
        if (response.status === 200) {
            const cache = await caches.open(CACHE_DYNAMIC);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached ?? new Response(JSON.stringify({ error: 'Sin conexion' }),
            { headers: { 'Content-Type': 'application/json' } });
    }
}