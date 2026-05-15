import { STORAGE_KEY } from './config.js';

export class GameStorage {
    static save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                gameState: gameState
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            const timeDiff = Date.now() - parsed.timestamp;
            
            if (timeDiff > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            
            return parsed.gameState;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }

    static clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    }

    static hasSave() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }
}