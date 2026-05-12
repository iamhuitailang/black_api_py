class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
        this.defaultData = {
            currentLevel: 1,
            maxUnlockedLevel: 1,
            levels: {}
        };
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...this.defaultData, ...parsed };
            }
        } catch (e) {
            console.error('加载失败，重置存档:', e);
            this.clearAll();
        }
        return { ...this.defaultData };
    }

    saveLevelProgress(level, stars, gameState = null) {
        const data = this.load();
        if (!data.levels[level]) {
            data.levels[level] = {};
        }
        data.levels[level].stars = Math.max(data.levels[level].stars || 0, stars);
        data.levels[level].completed = true;
        if (gameState) {
            data.levels[level].gameState = gameState;
        }
        if (level >= data.maxUnlockedLevel) {
            data.maxUnlockedLevel = level + 1;
        }
        data.currentLevel = level;
        return this.save(data);
    }

    getLevelProgress(level) {
        const data = this.load();
        return data.levels[level] || { stars: 0, completed: false };
    }

    getMaxUnlockedLevel() {
        const data = this.load();
        return data.maxUnlockedLevel;
    }

    saveGameState(level, gameState) {
        const data = this.load();
        if (!data.levels[level]) {
            data.levels[level] = {};
        }
        data.levels[level].gameState = gameState;
        data.currentLevel = level;
        return this.save(data);
    }

    getGameState(level) {
        const data = this.load();
        const levelData = data.levels[level];
        if (!levelData || !levelData.gameState) {
            return null;
        }
        const gameState = levelData.gameState;
        if (gameState.isGameOver || gameState.isWin) {
            return null;
        }
        if (!gameState.candy || !gameState.ropes) {
            return null;
        }
        console.log('加载存档成功:', gameState);
        return gameState;
    }

    clearGameState(level) {
        const data = this.load();
        if (data.levels[level]) {
            delete data.levels[level].gameState;
            this.save(data);
        }
    }

    clearAll() {
        localStorage.removeItem(this.key);
    }
}

const storageManager = new StorageManager();