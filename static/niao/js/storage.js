class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
        this.gameStateKey = CONFIG.STORAGE_KEY + '_game';
    }

    saveProgress(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    }

    loadProgress() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                return JSON.parse(data);
            }
            return {
                currentLevel: 1,
                unlockedLevels: 1,
                levelStars: {},
                totalScore: 0
            };
        } catch (e) {
            console.error('加载失败:', e);
            return {
                currentLevel: 1,
                unlockedLevels: 1,
                levelStars: {},
                totalScore: 0
            };
        }
    }

    saveGameState(gameState) {
        try {
            localStorage.setItem(this.gameStateKey, JSON.stringify(gameState));
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
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    }

    clearGameState() {
        localStorage.removeItem(this.gameStateKey);
    }

    saveLevelProgress(level, stars, score) {
        const data = this.loadProgress();
        data.levelStars[level] = Math.max(data.levelStars[level] || 0, stars);
        data.totalScore += score;
        if (level >= data.unlockedLevels) {
            data.unlockedLevels = level + 1;
        }
        return this.saveProgress(data);
    }

    getLevelStars(level) {
        const data = this.loadProgress();
        return data.levelStars[level] || 0;
    }

    reset() {
        localStorage.removeItem(this.key);
        localStorage.removeItem(this.gameStateKey);
    }
}

const storage = new StorageManager();
