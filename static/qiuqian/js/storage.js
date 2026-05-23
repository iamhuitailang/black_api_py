class StorageManager {
    constructor() {
        this.bestRecordKey = GameConfig.storageKeys.BEST_RECORD;
        this.gameStateKey = GameConfig.storageKeys.GAME_STATE;
    }
    
    getBestRecord() {
        try {
            const data = localStorage.getItem(this.bestRecordKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取最佳记录失败:', e);
        }
        return {
            longestSurvival: 0,
            highestLevel: 0,
            totalGames: 0
        };
    }
    
    saveBestRecord(record) {
        try {
            const current = this.getBestRecord();
            const newRecord = {
                longestSurvival: Math.max(current.longestSurvival, record.longestSurvival || 0),
                highestLevel: Math.max(current.highestLevel, record.highestLevel || 0),
                totalGames: (current.totalGames || 0) + 1
            };
            localStorage.setItem(this.bestRecordKey, JSON.stringify(newRecord));
            return newRecord;
        } catch (e) {
            console.error('保存最佳记录失败:', e);
            return record;
        }
    }
    
    saveGameState(state) {
        try {
            const data = {
                ...state,
                savedAt: Date.now()
            };
            localStorage.setItem(this.gameStateKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    }
    
    loadGameState() {
        try {
            const data = localStorage.getItem(this.gameStateKey);
            if (data) {
                const state = JSON.parse(data);
                const savedTime = Date.now() - (state.savedAt || 0);
                if (savedTime < 300000) {
                    return state;
                } else {
                    this.clearGameState();
                    return null;
                }
            }
        } catch (e) {
            console.error('读取游戏状态失败:', e);
        }
        return null;
    }
    
    clearGameState() {
        try {
            localStorage.removeItem(this.gameStateKey);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    }
    
    hasSavedGame() {
        return localStorage.getItem(this.gameStateKey) !== null;
    }
}

window.StorageManager = StorageManager;
