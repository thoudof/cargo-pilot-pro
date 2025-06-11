
// Service Worker для обработки PUSH-уведомлений
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'У вас новое уведомление',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
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
      self.registration.showNotification(data.title || 'Новое уведомление', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});
