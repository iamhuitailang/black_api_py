const NotificationManager = {
    alarms: [],
    checkInterval: null,

    init() {
        this.updateAlarms();
        this.startChecking();
    },

    updateAlarms() {
        const schedule = Storage.loadSchedule();
        this.alarms = [];

        Object.values(schedule).forEach(slot => {
            if (slot.enabled && slot.time) {
                this.alarms.push({
                    time: slot.time,
                    name: slot.name,
                    icon: slot.icon || '🐕',
                    duration: slot.duration || 20,
                    notified: false
                });
            }
        });
    },

    startChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(() => {
            this.checkAlarms();
        }, 30000); // 每30秒检查一次

        this.checkAlarms();
    },

    checkAlarms() {
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.alarms.forEach(alarm => {
            if (alarm.time === currentTime && !alarm.notified) {
                this.sendNotification(alarm);
                alarm.notified = true;

                setTimeout(() => {
                    alarm.notified = false;
                }, 60000);
            }
        });
    },

    sendNotification(alarm) {
        const title = `${alarm.icon} 该遛狗啦！`;
        const body = `${alarm.name}遛狗时间到了，预计${alarm.duration}分钟，带狗狗出去走走吧！🐕`;

        try {
            const notification = new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐕</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐾</text></svg>',
                tag: 'dog-walk-reminder',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                App.showNotification('去打卡吧！🐾');
            };

            App.showNotification(`🔔 ${title}`);
        } catch (e) {
            console.log('发送通知失败:', e);
        }
    },

    requestPermission() {
        return Notification.requestPermission();
    },

    isSupported() {
        return 'Notification' in window;
    }
};