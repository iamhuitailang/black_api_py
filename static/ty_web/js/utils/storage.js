const Storage = {
    PREFIX: 'ty_warrior_',

    get(key) {
        try {
            const value = localStorage.getItem(this.PREFIX + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    getToken() {
        return this.get('token');
    },

    setToken(token) {
        return this.set('token', token);
    },

    removeToken() {
        return this.remove('token');
    },

    getUser() {
        return this.get('user');
    },

    setUser(user) {
        return this.set('user', user);
    },

    removeUser() {
        return this.remove('user');
    },

    getGameState() {
        return this.get('game_state');
    },

    setGameState(state) {
        return this.set('game_state', state);
    }
};
