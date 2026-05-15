const Storage = {
    STORAGE_KEY: 'racing_game_data',

    save(data) {
        try {
            const existing = this.load();
            const merged = { ...existing, ...data };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            console.error('Failed to load game data:', e);
            return this.getDefaultData();
        }
    },

    getDefaultData() {
        return {
            bestRecords: [],
            currentDifficulty: 'medium',
            lastGameState: null
        };
    },

    saveRecord(record) {
        const data = this.load();
        data.bestRecords.push({
            ...record,
            timestamp: Utils.now()
        });
        data.bestRecords.sort((a, b) => a.time - b.time);
        data.bestRecords = data.bestRecords.slice(0, 10);
        return this.save(data);
    },

    saveDifficulty(difficulty) {
        return this.save({ currentDifficulty: difficulty });
    },

    saveGameState(state) {
        return this.save({ lastGameState: state });
    },

    clearGameState() {
        return this.save({ lastGameState: null });
    },

    getDifficulty() {
        const data = this.load();
        return data.currentDifficulty || 'medium';
    },

    getRecords() {
        const data = this.load();
        return data.bestRecords || [];
    },

    getLastGameState() {
        const data = this.load();
        return data.lastGameState;
    }
};