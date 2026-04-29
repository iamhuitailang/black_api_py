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
        return this.get('jn_user_token');
    },

    setToken(token) {
        this.set('jn_user_token', token);
    },

    removeToken() {
        this.remove('jn_user_token');
    },

    getUser() {
        return this.get('jn_user_info');
    },

    setUser(user) {
        this.set('jn_user_info', user);
    },

    removeUser() {
        this.remove('jn_user_info');
    }
};

window.Storage = Storage;
