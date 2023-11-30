window.NotificationsManager = {
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
    scheduleNotification: (message, delayMs) => {
        return new Promise((resolve) => {
            try {
                if (Notification.permission === "granted") {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = event => {
                        if (event.data.error) {
                            console.error(`NotificationsManager.scheduleNotification ERROR: ${error.message}`);
                        }
                    }
                    navigator.serviceWorker.controller.postMessage({ message: message, delayMs: delayMs, url: window.location.href }, [messageChannel.port2]);
                }                
                resolve(true);
            } catch (error) {
                resolve(false);
            }
        })
    }
};