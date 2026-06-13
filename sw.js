// oberlinweather.site — Service Worker
// Caches shell assets for offline access and fast load

const CACHE_NAME = 'oberlinwx-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ob-weather-icon.png',
  '/hero.png',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install — cache shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(SHELL_ASSETS).catch(err => {
        // Don't fail install if external CDN assets can't cache
        console.warn('SW: some assets failed to cache', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for API calls, cache first for shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for weather API calls
  const isApiCall = [
    'api.open-meteo.com',
    'air-quality-api.open-meteo.com',
    'archive-api.open-meteo.com',
    'api.rainviewer.com',
    'tilecache.rainviewer.com',
    'api.weather.gov',
    'data.blitzortung.org',
    'firms.modaps.eosdis.nasa.gov',
    'satepsanone.nesdis.noaa.gov',
    'api.purpleair.com'
  ].some(domain => url.hostname.includes(domain));

  if (isApiCall) {
    // Network first, no caching for live data
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache first for shell assets (app loads instantly)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache valid responses for shell assets
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Background sync placeholder for future log sync to Supabase
self.addEventListener('sync', event => {
  if (event.tag === 'sync-logs') {
    // Future: sync localStorage logs to Supabase when back online
    console.log('SW: background sync triggered for logs');
  }
});
