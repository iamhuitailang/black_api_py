import { CONFIG } from './config_v2.js';

export const Storage = {
    save(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    hasSave() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    },
};
