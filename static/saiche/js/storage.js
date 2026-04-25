const Storage = {
    STORAGE_KEY: 'mengche_game_data',
    
    defaultData: {
        bestDistance: 0,
        currentGame: null,
        totalGames: 0,
        totalScore: 0
    },

    save: function(data) {
        try {
            const existing = this.load();
            const merged = { ...existing, ...data };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
            return true;
        } catch (e) {
            console.warn('Storage save failed:', e);
            return false;
        }
    },

    load: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
        } catch (e) {
            console.warn('Storage load failed:', e);
        }
        return { ...this.defaultData };
    },

    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.warn('Storage clear failed:', e);
            return false;
        }
    },

    getBestDistance: function() {
        return this.load().bestDistance || 0;
    },

    setBestDistance: function(distance) {
        const data = this.load();
        if (distance > (data.bestDistance || 0)) {
            this.save({ bestDistance: distance });
            return true;
        }
        return false;
    },

    saveGameState: function(gameState) {
        const data = {
            currentGame: {
                timestamp: Date.now(),
                state: gameState
            }
        };
        return this.save(data);
    },

    loadGameState: function() {
        const data = this.load();
        if (data.currentGame) {
            const age = Date.now() - data.currentGame.timestamp;
            if (age < 3600000) {
                return data.currentGame.state;
            }
        }
        return null;
    },

    clearGameState: function() {
        this.save({ currentGame: null });
    },

    addGameStats: function(distance, score) {
        const data = this.load();
        const newData = {
            totalGames: (data.totalGames || 0) + 1,
            totalScore: (data.totalScore || 0) + score
        };
        if (distance > (data.bestDistance || 0)) {
            newData.bestDistance = distance;
        }
        this.save(newData);
    }
};
