const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },

    get(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getToken() {
        return this.get('zashua02_token');
    },

    setToken(token) {
        this.set('zashua02_token', token);
    },

    removeToken() {
        this.remove('zashua02_token');
    },

    getUser() {
        return this.get('zashua02_user');
    },

    setUser(user) {
        this.set('zashua02_user', user);
    },

    removeUser() {
        this.remove('zashua02_user');
    },

    getSettings() {
        return this.get('zashua02_settings') || {
            theme: 'circus',
            difficulty: 'normal',
            characterType: 'clown'
        };
    },

    setSettings(settings) {
        this.set('zashua02_settings', settings);
    },

    getGameState() {
        return this.get('zashua02_game_state');
    },

    setGameState(state) {
        this.set('zashua02_game_state', state);
    }
};

window.Storage = Storage;
