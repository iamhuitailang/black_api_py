const Storage = {
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) return defaultValue;
            return JSON.parse(data);
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    getHighScore() {
        return this.get(GameConfig.STORAGE_KEYS.HIGH_SCORE, 0);
    },
    
    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.set(GameConfig.STORAGE_KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    },
    
    getRecords() {
        return this.get(GameConfig.STORAGE_KEYS.RECORDS, []);
    },
    
    addRecord(record) {
        const records = this.getRecords();
        records.unshift(record);
        records.sort((a, b) => b.score - a.score);
        if (records.length > GameConfig.MAX_RECORDS) {
            records.splice(GameConfig.MAX_RECORDS);
        }
        this.set(GameConfig.STORAGE_KEYS.RECORDS, records);
        return records;
    },
    
    saveGameState(state) {
        this.set(GameConfig.STORAGE_KEYS.GAME_STATE, state);
    },
    
    getGameState() {
        return this.get(GameConfig.STORAGE_KEYS.GAME_STATE, null);
    },
    
    clearGameState() {
        this.remove(GameConfig.STORAGE_KEYS.GAME_STATE);
    },
    
    hasSavedGame() {
        return this.getGameState() !== null;
    }
};
