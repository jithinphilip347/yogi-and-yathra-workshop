/**
 * Service Worker for Yogify LMS Native Web Push Notifications
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Yogify Notification',
      body: event.data.text(),
    };
  }

  const title = data.title || 'Yogify Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-01.png',
    badge: data.badge || '/favicon.ico',
    tag: data.data?.notification_id ? `notif-${data.data.notification_id}` : 'yogify-notif',
    renotify: true,
    data: {
      action_url: data.action_url || data.data?.action_url || '/notifications',
      notification_id: data.data?.notification_id || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.action_url || '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the same origin
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(actionUrl);
          }
          return client.focus();
        }
      }

      // If no open client was found, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
    })
  );
});
