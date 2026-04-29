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
        return this.get('xq_admin_token');
    },

    setToken(token) {
        this.set('xq_admin_token', token);
    },

    removeToken() {
        this.remove('xq_admin_token');
    },

    getUser() {
        return this.get('xq_admin_user');
    },

    setUser(user) {
        this.set('xq_admin_user', user);
    },

    removeUser() {
        this.remove('xq_admin_user');
    }
};
