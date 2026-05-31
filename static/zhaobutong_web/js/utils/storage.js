const ZbtStorage = {
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
        return this.get('zbt_token');
    },

    setToken(token) {
        this.set('zbt_token', token);
    },

    removeToken() {
        this.remove('zbt_token');
    },

    getUser() {
        return this.get('zbt_user');
    },

    setUser(user) {
        this.set('zbt_user', user);
    },

    removeUser() {
        this.remove('zbt_user');
    },

    setGameData(data) {
        this.set('zbt_game_data', data);
    },

    getGameData() {
        return this.get('zbt_game_data');
    },

    removeGameData() {
        this.remove('zbt_game_data');
    },

    setGameState(state) {
        this.set('zbt_game_state', state);
    },

    getGameState() {
        return this.get('zbt_game_state');
    },

    removeGameState() {
        this.remove('zbt_game_state');
    }
};
