const CACHE_NAME = 'elmeks-cache-v7'; // Version hochgezählt
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './js/modules/ui.js',
  './js/modules/avatar.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js'
];

// 1. Installieren: Sofort Cache füllen & Aktivierung erzwingen
self.addEventListener('install', (event) => {
  // WICHTIG: skipWaiting zwingt den neuen SW sofort aktiv zu werden
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Fehler ignorieren, falls eine Datei fehlt (damit die App trotzdem installiert)
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log("Caching partial warning", err));
    })
  );
});

// 2. Aktivieren: Sofort Kontrolle über alle offenen Tabs übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Alte Caches löschen
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }));
      }),
      // WICHTIG: Sofortige Kontrolle über Clients (kein Reload nötig)
      self.clients.claim() 
    ])
  );
});

// 3. Fetch: Offline-First Strategie
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
            if(event.request.url.startsWith('http')) {
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        });
      });
    })
  );
});