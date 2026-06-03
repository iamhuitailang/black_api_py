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
        return this.get('gq_user_token');
    },

    setToken(token) {
        this.set('gq_user_token', token);
    },

    removeToken() {
        this.remove('gq_user_token');
    },

    getUser() {
        return this.get('gq_user');
    },

    setUser(user) {
        this.set('gq_user', user);
    },

    removeUser() {
        this.remove('gq_user');
    },

    getGameState() {
        return this.get('gq_game_state');
    },

    setGameState(state) {
        this.set('gq_game_state', state);
    },

    removeGameState() {
        this.remove('gq_game_state');
    }
};
