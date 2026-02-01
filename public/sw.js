// Service Worker для PWA с офлайн-поддержкой
const CACHE_NAME = 'logistics-app-v1';
const STATIC_CACHE = 'logistics-static-v1';
const DYNAMIC_CACHE = 'logistics-dynamic-v1';

// Статические ресурсы для предзагрузки
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/lovable-uploads/1a2ab69e-d088-4847-b64c-026efae5c05f.png'
];

// API endpoints для кэширования
const API_CACHE_URLS = [
  '/rest/v1/trips',
  '/rest/v1/drivers',
  '/rest/v1/vehicles',
  '/rest/v1/routes',
  '/rest/v1/contractors'
];

// Install - кэшируем статические ресурсы
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - очищаем старые кэши
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - стратегия Network First с fallback на кэш
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // Пропускаем Chrome Extensions и другие схемы
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API запросы - Network First
  if (url.pathname.includes('/rest/v1/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Статические ресурсы - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Все остальное - Network First
  event.respondWith(networkFirst(request));
});

// Cache First стратегия
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return caches.match('/index.html');
  }
}

// Network First стратегия
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Кэшируем успешные ответы
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Пробуем получить из кэша
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Для навигационных запросов возвращаем главную страницу
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    // Возвращаем offline response для API
    if (request.url.includes('/rest/v1/')) {
      return new Response(
        JSON.stringify({ 
          error: 'offline', 
          message: 'Нет подключения к интернету',
          cached: false 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Проверка статических ресурсов
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'У вас новое уведомление',
      icon: '/lovable-uploads/1a2ab69e-d088-4847-b64c-026efae5c05f.png',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        notificationId: data.notificationId
      },
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Просмотреть'
        },
        {
          action: 'dismiss',
          title: 'Закрыть'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Грузоперевозки', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Ищем открытое окно
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.navigate(url);
              return client.focus();
            }
          }
          // Открываем новое окно
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Background sync для офлайн-операций
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-trips') {
    event.waitUntil(syncPendingTrips());
  }
});

async function syncPendingTrips() {
  try {
    // Получаем ожидающие синхронизации данные из IndexedDB
    // Это заглушка - реальная реализация потребует IndexedDB
    console.log('[SW] Syncing pending trips...');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Периодическая фоновая синхронизация
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

async function updateCachedData() {
  console.log('[SW] Updating cached data...');
  // Обновляем кэш данных
}
