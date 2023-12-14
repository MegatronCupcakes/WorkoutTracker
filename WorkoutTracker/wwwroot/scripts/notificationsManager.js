window.NotificationsManager = {
    messageFromServiceWorker: false,
    waitingToNotify: null,
    notificationsEnabled: () => {
        return new Promise((resolve) => {
            try {
                if (!("Notification" in window)) resolve(false);                
                resolve(Notification.permission === "granted");
            } catch (error) {
                console.error(`NotificationsManager.notificationsEnabled ERROR: ${error.message}`);
                resolve(false);
            }
        });
    },
    requestPermission: () => {
        return new Promise(async (resolve) => {
            try {
                resolve((await Notification.requestPermission()) === "granted");
            } catch (error) {
                resolve(false);
            }
        })
    },
    scheduleNotification: (message, delayInMilliseconds) => {
        if (Notification.permission === "granted") {
            /**
             * Ideally notifications are sent from the service worker; this would allow for notifications even when the window is closed.
             * Service workers, however, have a limited lifespan (approximately 30 seconds) and therefore do not live long enough to 
             * issue notifications.  If this application had a server component, the solution would be to subscribe to push notifications
             * and initiate the notification server side.  I'm experimenting with ways to prolong the service worker's life, but in the meantime
             * we will issue the notification here in the browser after a simple timeout.
             */
            if (NotificationsManager.messageFromServiceWorker) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = event => {
                    if (event.data.error) {
                        console.error(`NotificationsManager.scheduleNotification ERROR: ${error.message}`);
                    }
                }
                navigator.serviceWorker.controller.postMessage({ message: message, delayMs: delayInMilliseconds, url: window.location.href }, [messageChannel.port2]);
            } else {
                // clear any existing timeout if the user has moved on to the next workout activity early.
                try {
                    clearTimeout(NotificationsManager.waitingToNotify);
                } catch (error) {
                    // we tried...
                }
                // capture timeout
                NotificationsManager.waitingToNotify = setTimeout(() => {
                    const notification = new Notification('WorkoutTracker', {
                        body: message,
                        icon: 'icon-512.png',
                        vibrate: [100, 50, 100],
                        data: {
                            url: window.location.href
                        }
                    });
                    NotificationsManager.waitingToNotify = null;
                }, delayInMilliseconds);
            }
        }
             
    }
};