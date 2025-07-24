const CACHE_NAME = 'city-chat-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline with better error handling
self.addEventListener('fetch', (event) => {
  // Skip non-http requests and external API calls
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // Return offline fallback if available
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          throw new Error('Network error and no cache available');
        });
      })
      .catch((error) => {
        console.log('Fetch failed:', error);
        throw error;
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 