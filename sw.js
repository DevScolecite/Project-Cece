// sw.js - Service Worker Listener
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Bring your app window focus back to the page when tapped
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
