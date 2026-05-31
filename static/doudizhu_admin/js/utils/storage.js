const Storage = {
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return localStorage.getItem(key);
        }
    },

    set(key, value) {
        if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getToken() {
        return this.get('doudizhu_admin_token');
    },

    setToken(token) {
        this.set('doudizhu_admin_token', token);
    },

    removeToken() {
        this.remove('doudizhu_admin_token');
    },

    getAdmin() {
        return this.get('doudizhu_admin');
    },

    setAdmin(admin) {
        this.set('doudizhu_admin', admin);
    },

    removeAdmin() {
        this.remove('doudizhu_admin');
    }
};
