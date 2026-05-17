class StorageManager {
    constructor() {
        this.storageKey = CONFIG.STORAGE_KEY;
        this.defaultData = this.getDefaultData();
    }

    getDefaultData() {
        return {
            highScore: 0,
            unlockedLevels: [1],
            completedLevels: [],
            levelScores: {},
            totalPlayTime: 0,
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                difficulty: 'normal'
            },
            lastSave: null,
            currentGame: null
        };
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...this.defaultData, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
        }
        return { ...this.defaultData };
    }

    save(data) {
        try {
            data.lastSave = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    }

    saveGameState(gameState) {
        const data = this.load();
        data.currentGame = {
            ...gameState,
            savedAt: Date.now()
        };
        return this.save(data);
    }

    loadGameState() {
        const data = this.load();
        return data.currentGame || null;
    }

    clearGameState() {
        const data = this.load();
        data.currentGame = null;
        return this.save(data);
    }

    updateHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true;
        }
        return false;
    }

    getHighScore() {
        const data = this.load();
        return data.highScore || 0;
    }

    unlockLevel(levelNumber) {
        const data = this.load();
        if (!data.unlockedLevels.includes(levelNumber)) {
            data.unlockedLevels.push(levelNumber);
            this.save(data);
        }
    }

    completeLevel(levelNumber, score, time, rank) {
        const data = this.load();
        if (!data.completedLevels.includes(levelNumber)) {
            data.completedLevels.push(levelNumber);
        }
        
        const levelKey = `level_${levelNumber}`;
        if (!data.levelScores[levelKey] || score > data.levelScores[levelKey].score) {
            data.levelScores[levelKey] = { score, time, rank };
        }
        
        if (levelNumber < 7) {
            this.unlockLevel(levelNumber + 1);
        }
        
        this.save(data);
    }

    isLevelUnlocked(levelNumber) {
        const data = this.load();
        return data.unlockedLevels.includes(levelNumber) || levelNumber === 1;
    }

    isLevelCompleted(levelNumber) {
        const data = this.load();
        return data.completedLevels.includes(levelNumber);
    }

    getLevelStats(levelNumber) {
        const data = this.load();
        return data.levelScores[`level_${levelNumber}`] || null;
    }

    hasSavedGame() {
        const data = this.load();
        return data.currentGame !== null;
    }

    resetAll() {
        localStorage.removeItem(this.storageKey);
    }

    getSettings() {
        const data = this.load();
        return data.settings;
    }

    updateSettings(settings) {
        const data = this.load();
        data.settings = { ...data.settings, ...settings };
        return this.save(data);
    }
}

const Storage = new StorageManager();
