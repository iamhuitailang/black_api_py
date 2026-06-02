const Storage = {
    PREFIX: 'heping_',

    set(key, value) {
        if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
        }
        localStorage.setItem(this.PREFIX + key, value);
    },

    get(key) {
        const value = localStorage.getItem(this.PREFIX + key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    },

    getToken() {
        return this.get('user_token');
    },

    setToken(token) {
        this.set('user_token', token);
    },

    removeToken() {
        this.remove('user_token');
    },

    getUser() {
        return this.get('user');
    },

    setUser(user) {
        this.set('user', user);
    },

    removeUser() {
        this.remove('user');
    },

    getAdminToken() {
        return this.get('admin_token');
    },

    setAdminToken(token) {
        this.set('admin_token', token);
    },

    removeAdminToken() {
        this.remove('admin_token');
    },

    getGameState() {
        return this.get('game_state');
    },

    setGameState(state) {
        this.set('game_state', state);
    },

    removeGameState() {
        this.remove('game_state');
    }
};
