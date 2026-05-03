(function(global) {
    'use strict';

    const Notification = {
        isSupported: function() {
            return 'Notification' in window;
        },

        isGranted: function() {
            return this.isSupported() && window.Notification.permission === 'granted';
        },

        requestPermission: function() {
            if (!this.isSupported()) {
                return Promise.reject(new Error('浏览器不支持通知'));
            }

            if (this.isGranted()) {
                return Promise.resolve('granted');
            }

            return window.Notification.requestPermission();
        },

        sendNotification: function(title, options = {}) {
            if (!this.isGranted()) {
                return null;
            }

            const defaultOptions = {
                icon: '🌿',
                badge: '💧',
                tag: 'zhiwu-watering'
            };

            return new window.Notification(title, { ...defaultOptions, ...options });
        },

        sendWateringReminder: function(plants) {
            if (!this.isGranted() || plants.length === 0) {
                return;
            }

            const overduePlants = plants.filter(p => ScheduleModule && ScheduleModule.isOverdue(p));
            const todayPlants = plants.filter(p => ScheduleModule && 
                ScheduleModule.shouldWaterToday(p) && 
                !ScheduleModule.isOverdue(p));

            let title = '';
            let body = '';

            if (overduePlants.length > 0) {
                title = `⚠️ ${overduePlants.length} 株植物需要紧急浇水！`;
                body = overduePlants.map(p => p.name).join('、');
                if (todayPlants.length > 0) {
                    body += `\n今日还需浇水: ${todayPlants.map(p => p.name).join('、')}`;
                }
            } else if (todayPlants.length > 0) {
                title = `💧 今日有 ${todayPlants.length} 株植物需要浇水`;
                body = todayPlants.map(p => p.name).join('、');
            }

            if (title) {
                this.sendNotification(title, {
                    body: body,
                    icon: '🌿'
                });
            }
        },

        shouldCheckToday: function() {
            const lastNotification = StorageModule ? StorageModule.getLastNotification() : null;
            if (!lastNotification) return true;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            lastNotification.setHours(0, 0, 0, 0);

            return lastNotification < today;
        },

        shouldSendDelayReminder: function(delayHours = 2) {
            const lastDelayNotification = StorageModule ? StorageModule.getLastDelayNotification() : null;
            if (!lastDelayNotification) return true;

            const now = new Date();
            const diffMs = now - lastDelayNotification;
            const diffHours = diffMs / (1000 * 60 * 60);

            return diffHours >= delayHours;
        },

        checkAndNotify: function() {
            if (!this.isGranted()) {
                return false;
            }

            const plants = StorageModule ? StorageModule.getPlants() : [];
            const plantsNeedingWater = ScheduleModule ? 
                ScheduleModule.getPlantsNeedingWaterToday(plants) : [];

            if (plantsNeedingWater.length === 0) {
                return false;
            }

            if (this.shouldCheckToday()) {
                this.sendWateringReminder(plantsNeedingWater);
                if (StorageModule) {
                    StorageModule.setLastNotification();
                }
                return true;
            }

            const settings = StorageModule ? StorageModule.getSettings() : {};
            const delayHours = settings.delayReminderHours || 2;

            const overduePlants = plantsNeedingWater.filter(p => 
                ScheduleModule && ScheduleModule.isOverdue(p)
            );

            if (overduePlants.length > 0 && this.shouldSendDelayReminder(delayHours)) {
                this.sendWateringReminder(overduePlants);
                if (StorageModule) {
                    StorageModule.setLastDelayNotification();
                }
                return true;
            }

            return false;
        },

        startPeriodicCheck: function(intervalMs = 60000) {
            return setInterval(() => {
                this.checkAndNotify();
            }, intervalMs);
        },

        testNotification: function() {
            return this.sendNotification('🌿 植物浇水日历', {
                body: '这是一条测试通知，通知功能正常工作！',
                icon: '🌱'
            });
        }
    };

    global.NotificationModule = Notification;
})(window);
