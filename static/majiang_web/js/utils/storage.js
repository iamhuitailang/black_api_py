const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },

    get(key, defaultValue = null) {
        let value = localStorage.getItem(key);
        if (value === null) {
            return defaultValue;
        }
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

    setUser(user) {
        this.set('majiang_user', user);
    },

    getUser() {
        return this.get('majiang_user', {});
    },

    removeUser() {
        this.remove('majiang_user');
    },

    setGameState(state) {
        this.set('majiang_game_state', state);
    },

    getGameState() {
        return this.get('majiang_game_state', null);
    },

    removeGameState() {
        this.remove('majiang_game_state');
    }
};
