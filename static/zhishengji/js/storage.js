class StorageManager {
    constructor() {
        this.storageKey = CONFIG.STORAGE_KEY;
        this.defaultData = {
            unlockedLevels: 1,
            completedLevels: [],
            highScores: {},
            unlockedHelicopters: ['small'],
            currentGame: null
        };
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return { ...this.defaultData };
    }

    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    }

    saveGameState(gameState) {
        const data = this.load();
        data.currentGame = gameState;
        return this.save(data);
    }

    clearGameState() {
        const data = this.load();
        data.currentGame = null;
        return this.save(data);
    }

    hasSavedGame() {
        const data = this.load();
        return data.currentGame !== null;
    }

    completeLevel(level, score) {
        const data = this.load();
        
        if (!data.completedLevels.includes(level)) {
            data.completedLevels.push(level);
        }
        
        if (!data.highScores[level] || score > data.highScores[level]) {
            data.highScores[level] = score;
        }
        
        if (level >= data.unlockedLevels && level < 5) {
            data.unlockedLevels = level + 1;
        }
        
        if (level >= 2 && !data.unlockedHelicopters.includes('medium')) {
            data.unlockedHelicopters.push('medium');
        }
        
        return this.save(data);
    }

    getUnlockedLevels() {
        const data = this.load();
        return data.unlockedLevels;
    }

    getCompletedLevels() {
        const data = this.load();
        return data.completedLevels;
    }

    getUnlockedHelicopters() {
        const data = this.load();
        return data.unlockedHelicopters;
    }

    getHighScore(level) {
        const data = this.load();
        return data.highScores[level] || 0;
    }
}

const storageManager = new StorageManager();