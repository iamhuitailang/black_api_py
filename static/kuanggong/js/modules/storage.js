import { STORAGE_KEY } from './config.js';

export const Storage = {
    save(data) {
        try {
            const saveData = {
                ...data,
                lastSaveTime: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
            console.log('State saved to localStorage:', STORAGE_KEY, saveData);
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('State loaded from localStorage:', STORAGE_KEY, parsed);
                return parsed;
            }
            console.log('No saved state found in localStorage for key:', STORAGE_KEY);
            return null;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    hasSave() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    },

    getLastSaveTime() {
        const data = this.load();
        return data ? data.lastSaveTime || 0 : 0;
    }
};
