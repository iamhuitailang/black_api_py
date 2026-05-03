(function(global) {
    'use strict';

    const STORAGE_KEYS = {
        PLANTS: 'zhiwu_plants',
        HISTORY: 'zhiwu_history',
        SETTINGS: 'zhiwu_settings',
        LAST_NOTIFICATION: 'zhiwu_last_notification'
    };

    const Storage = {
        getPlants: function() {
            const data = localStorage.getItem(STORAGE_KEYS.PLANTS);
            return data ? JSON.parse(data) : [];
        },

        savePlants: function(plants) {
            localStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
        },

        getPlantById: function(id) {
            const plants = this.getPlants();
            return plants.find(p => p.id === id);
        },

        addPlant: function(plant) {
            const plants = this.getPlants();
            plant.id = Date.now().toString();
            plant.createdAt = new Date().toISOString();
            plants.push(plant);
            this.savePlants(plants);
            return plant;
        },

        updatePlant: function(id, updates) {
            const plants = this.getPlants();
            const index = plants.findIndex(p => p.id === id);
            if (index !== -1) {
                plants[index] = { ...plants[index], ...updates };
                this.savePlants(plants);
                return plants[index];
            }
            return null;
        },

        deletePlant: function(id) {
            const plants = this.getPlants();
            const filtered = plants.filter(p => p.id !== id);
            this.savePlants(filtered);
        },

        getHistory: function() {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        },

        saveHistory: function(history) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        },

        addWateringRecord: function(plantId, plantName, date = new Date()) {
            const history = this.getHistory();
            const record = {
                id: Date.now().toString(),
                plantId: plantId,
                plantName: plantName,
                date: date.toISOString(),
                timestamp: date.getTime()
            };
            history.push(record);
            this.saveHistory(history);
            return record;
        },

        getPlantHistory: function(plantId) {
            const history = this.getHistory();
            return history.filter(h => h.plantId === plantId).sort((a, b) => b.timestamp - a.timestamp);
        },

        deletePlantHistory: function(plantId) {
            const history = this.getHistory();
            const filtered = history.filter(h => h.plantId !== plantId);
            this.saveHistory(filtered);
        },

        getSettings: function() {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                notificationEnabled: true,
                notificationTime: '09:00',
                delayReminderHours: 2
            };
        },

        saveSettings: function(settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        },

        getLastNotification: function() {
            const data = localStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION);
            return data ? new Date(data) : null;
        },

        setLastNotification: function(date = new Date()) {
            localStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION, date.toISOString());
        },

        getLastDelayNotification: function() {
            const data = localStorage.getItem('zhiwu_last_delay_notification');
            return data ? new Date(data) : null;
        },

        setLastDelayNotification: function(date = new Date()) {
            localStorage.setItem('zhiwu_last_delay_notification', date.toISOString());
        },

        clearAll: function() {
            Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            localStorage.removeItem('zhiwu_last_delay_notification');
        }
    };

    global.StorageModule = Storage;
})(window);
