const Storage = {
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) return defaultValue;
            return JSON.parse(data);
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
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
        return this.load(GameConfig.STORAGE_KEYS.HIGH_SCORE, 0);
    },

    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.save(GameConfig.STORAGE_KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    },

    getHighCombo() {
        return this.load(GameConfig.STORAGE_KEYS.HIGH_COMBO, 0);
    },

    setHighCombo(combo) {
        const current = this.getHighCombo();
        if (combo > current) {
            this.save(GameConfig.STORAGE_KEYS.HIGH_COMBO, combo);
            return true;
        }
        return false;
    },

    getTheme() {
        return this.load(GameConfig.STORAGE_KEYS.THEME, 'sunny');
    },

    setTheme(theme) {
        return this.save(GameConfig.STORAGE_KEYS.THEME, theme);
    },

    saveGameState(state) {
        return this.save(GameConfig.STORAGE_KEYS.GAME_STATE, state);
    },

    loadGameState() {
        return this.load(GameConfig.STORAGE_KEYS.GAME_STATE, null);
    },

    clearGameState() {
        return this.remove(GameConfig.STORAGE_KEYS.GAME_STATE);
    }
};
