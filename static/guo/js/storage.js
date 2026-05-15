const Storage = {
    STORAGE_KEY: 'pan_night_game_save_v1',

    save(data) {
        try {
            const saveData = JSON.stringify(data);
            localStorage.setItem(this.STORAGE_KEY, saveData);
            console.log('Data saved to localStorage');
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                console.log('Data loaded from localStorage');
                return JSON.parse(data);
            }
            console.log('No saved data found');
            return null;
        } catch (e) {
            console.error('Failed to load:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Storage cleared');
    },

    saveGameState(gameState) {
        const data = {
            type: 'game_save',
            timestamp: Date.now(),
            ...gameState
        };
        return this.save(data);
    },

    loadGameState() {
        const data = this.load();
        if (data && data.type === 'game_save') {
            const age = Date.now() - data.timestamp;
            if (age < 3600000) {
                console.log('Valid game save found, age:', age / 1000, 'seconds');
                return data;
            } else {
                console.log('Save is too old:', age / 1000, 'seconds');
                this.clear();
            }
        }
        return null;
    }
};