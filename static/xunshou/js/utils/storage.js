const Storage = {
    KEYS: {
        GAME_STATE: 'xunshou_game_state',
        SETTINGS: 'xunshou_settings'
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage load error:', e);
            return null;
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

    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    saveGameState(state) {
        return this.save(this.KEYS.GAME_STATE, state);
    },

    loadGameState() {
        return this.load(this.KEYS.GAME_STATE);
    },

    saveSettings(settings) {
        return this.save(this.KEYS.SETTINGS, settings);
    },

    loadSettings() {
        return this.load(this.KEYS.SETTINGS);
    }
};
