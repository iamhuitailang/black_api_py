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
        return this.get('jt_user_token');
    },

    setToken(token) {
        this.set('jt_user_token', token);
    },

    removeToken() {
        this.remove('jt_user_token');
    },

    getUser() {
        return this.get('jt_user');
    },

    setUser(user) {
        this.set('jt_user', user);
    },

    removeUser() {
        this.remove('jt_user');
    },

    getGameState() {
        return this.get('jt_game_state');
    },

    setGameState(state) {
        this.set('jt_game_state', state);
    },

    removeGameState() {
        this.remove('jt_game_state');
    }
};

window.Storage = Storage;
