const Storage = {
    data: null,

    init() {
        this.load();
    },

    load() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                this.data = JSON.parse(saved);
            } else {
                this.data = this.getDefaultData();
            }
        } catch (e) {
            console.error('Error loading game data:', e);
            this.data = this.getDefaultData();
        }
        return this.data;
    },

    save() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving game data:', e);
        }
    },

    getDefaultData() {
        return {
            totalScore: 0,
            totalWins: 0,
            totalGames: 0,
            stats: {
                spikes: 0,
                blocks: 0,
                aces: 0
            },
            currentGame: null
        };
    },

    reset() {
        this.data = this.getDefaultData();
        this.save();
    },

    addScore(points) {
        this.data.totalScore += points;
        this.save();
    },

    addWin() {
        this.data.totalWins++;
        this.data.totalGames++;
        this.save();
    },

    addLoss() {
        this.data.totalGames++;
        this.save();
    },

    addStat(type, count = 1) {
        if (this.data.stats[type] !== undefined) {
            this.data.stats[type] += count;
        }
        this.save();
    },

    saveCurrentGame(gameState) {
        this.data.currentGame = gameState;
        this.save();
    },

    clearCurrentGame() {
        this.data.currentGame = null;
        this.save();
    },

    getCurrentGame() {
        return this.data.currentGame;
    },

    getTotalScore() {
        return this.data.totalScore;
    },

    getTotalWins() {
        return this.data.totalWins;
    },

    getStats() {
        return this.data.stats;
    }
};
