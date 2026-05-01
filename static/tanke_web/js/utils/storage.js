const Storage = {
    PREFIX: 'tanke_',

    set(key, value) {
        try {
            const prefixedKey = this.PREFIX + key;
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(prefixedKey, serializedValue);
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const prefixedKey = this.PREFIX + key;
            const value = localStorage.getItem(prefixedKey);
            if (value === null) {
                return defaultValue;
            }
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            const prefixedKey = this.PREFIX + key;
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
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

    setToken(token) {
        return this.set('token', token);
    },

    getToken() {
        return this.get('token', null);
    },

    removeToken() {
        return this.remove('token');
    },

    setUser(user) {
        return this.set('user', user);
    },

    getUser() {
        return this.get('user', null);
    },

    removeUser() {
        return this.remove('user');
    },

    setTank(tank) {
        return this.set('tank', tank);
    },

    getTank() {
        return this.get('tank', null);
    },

    removeTank() {
        return this.remove('tank');
    },

    setHighScore(score) {
        const current = this.get('highScore', 0);
        if (score > current) {
            return this.set('highScore', score);
        }
        return false;
    },

    getHighScore() {
        return this.get('highScore', 0);
    }
};

window.Storage = Storage;
