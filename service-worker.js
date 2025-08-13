// Isi untuk file service-worker.js

const CACHE_NAME = 'galeri-publik-cache-v1';
// Daftar file inti yang akan disimpan di cache
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'firebase-config.js',
  'manifest.json',
  'logo.png',
  'logo1.png'
];

// Langkah 1: Install Service Worker dan simpan file ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka dan file inti disimpan');
        return cache.addAll(urlsToCache);
      })
  );
});

// Langkah 2: Aktifkan Service Worker dan hapus cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Langkah 3: Sajikan file dari cache saat offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika request ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, ambil dari jaringan (internet)
        return fetch(event.request);
      }
    )
  );
});


