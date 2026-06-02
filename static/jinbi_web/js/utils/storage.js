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
        return this.get('jinbi_user_token');
    },

    setToken(token) {
        this.set('jinbi_user_token', token);
    },

    removeToken() {
        this.remove('jinbi_user_token');
    },

    getUser() {
        return this.get('jinbi_user');
    },

    setUser(user) {
        this.set('jinbi_user', user);
    },

    removeUser() {
        this.remove('jinbi_user');
    },

    getGameState() {
        return this.get('jinbi_game_state');
    },

    setGameState(state) {
        this.set('jinbi_game_state', state);
    },

    removeGameState() {
        this.remove('jinbi_game_state');
    },

    getAchievements() {
        return this.get('jinbi_achievements');
    },

    setAchievements(achievements) {
        this.set('jinbi_achievements', achievements);
    }
};

window.Storage = Storage;
