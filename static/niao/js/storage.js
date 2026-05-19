const Storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
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
        return this.get(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
    },
    
    setHighScore(score) {
        return this.set(CONFIG.STORAGE_KEYS.HIGH_SCORE, score);
    },
    
    getSelectedCharacter() {
        return this.get(CONFIG.STORAGE_KEYS.SELECTED_CHARACTER, 'yellow');
    },
    
    setSelectedCharacter(character) {
        return this.set(CONFIG.STORAGE_KEYS.SELECTED_CHARACTER, character);
    },
    
    getSelectedTheme() {
        return this.get(CONFIG.STORAGE_KEYS.SELECTED_THEME, 'sky');
    },
    
    setSelectedTheme(theme) {
        return this.set(CONFIG.STORAGE_KEYS.SELECTED_THEME, theme);
    },
    
    saveGameState(state) {
        return this.set(CONFIG.STORAGE_KEYS.GAME_STATE, state);
    },
    
    getGameState() {
        return this.get(CONFIG.STORAGE_KEYS.GAME_STATE, null);
    },
    
    clearGameState() {
        return this.remove(CONFIG.STORAGE_KEYS.GAME_STATE);
    }
};
