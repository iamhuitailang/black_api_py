import { STORAGE_KEY, DEFAULT_GAME_STATE } from './config.js';

export class StorageManager {
    constructor() {
        this.storageKey = STORAGE_KEY;
    }

    save(gameState) {
        try {
            const dataToSave = {
                ...gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            return false;
        }
    }

    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                const saveTime = parsedData.timestamp || 0;
                const currentTime = Date.now();
                const timeDiff = Math.floor((currentTime - saveTime) / 1000);
                
                if (parsedData.time !== undefined) {
                    parsedData.time = Math.max(0, parsedData.time - timeDiff);
                }
                
                return { ...DEFAULT_GAME_STATE, ...parsedData };
            }
            return null;
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            return null;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('清除游戏状态失败:', error);
            return false;
        }
    }

    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    getDefaultState() {
        return { ...DEFAULT_GAME_STATE };
    }
}

export const storageManager = new StorageManager();