const Storage = {
    prefix: 'feipin_web_',

    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            if (value === null) {
                return defaultValue;
            }
            return JSON.parse(value);
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            const keys = Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    getToken() {
        return this.get('token', null);
    },

    setToken(token) {
        return this.set('token', token);
    },

    removeToken() {
        return this.remove('token');
    },

    getUser() {
        return this.get('user', null);
    },

    setUser(user) {
        return this.set('user', user);
    },

    removeUser() {
        return this.remove('user');
    }
};
