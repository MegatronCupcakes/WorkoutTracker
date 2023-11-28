self.addEventListener('message', event => {
    const payload = event.data;
    event.waitUntil(
        setTimeout(() => {
            self.registration.showNotification('WorkoutTracker', {
                body: payload.message,
                icon: 'img/icon-512.png',
                vibrate: [100, 50, 100],
                data: { url: payload.url }
            })
        }, payload.delayMs)
    );
})

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});