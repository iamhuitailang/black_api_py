const Storage = {
    getDefaultSave() {
        return {
            highestWave: 0,
            totalKills: 0,
            highScore: 0,
            currentGame: null,
            settings: {
                difficulty: 'normal'
            }
        };
    },

    load() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                return Object.assign(this.getDefaultSave(), data);
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        return this.getDefaultSave();
    },

    save(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    },

    saveGameState(gameState) {
        const data = this.load();
        data.currentGame = gameState;
        this.save(data);
    },

    loadGameState() {
        const data = this.load();
        return data.currentGame;
    },

    clearGameState() {
        const data = this.load();
        data.currentGame = null;
        this.save(data);
    },

    updateStats(stats) {
        const data = this.load();
        if (stats.wave > data.highestWave) {
            data.highestWave = stats.wave;
        }
        data.totalKills += stats.kills;
        if (stats.score > data.highScore) {
            data.highScore = stats.score;
        }
        this.save(data);
    },

    getStats() {
        const data = this.load();
        return {
            highestWave: data.highestWave,
            totalKills: data.totalKills,
            highScore: data.highScore
        };
    },

    setDifficulty(difficulty) {
        const data = this.load();
        data.settings.difficulty = difficulty;
        this.save(data);
    },

    getDifficulty() {
        const data = this.load();
        return data.settings.difficulty;
    },

    resetAll() {
        this.save(this.getDefaultSave());
    }
};
