// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAP4BVnVkrI6HArkz5CCDvXyVsJ6Q-kFx4",
  authDomain: "bansgaonsandesh-bd46b.firebaseapp.com",
  projectId: "bansgaonsandesh-bd46b",
  storageBucket: "bansgaonsandesh-bd46b.firebasestorage.app",
  messagingSenderId: "244492195314",
  appId: "1:244492195314:web:f11d8412f6c9789d2cc76b",
  measurementId: "G-9YS8W4K2JX"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title || 'New Post';
  const notificationOptions = {
    body: payload.notification.body || 'Someone posted new content',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data,
    tag: payload.data?.postId || 'new-post',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
