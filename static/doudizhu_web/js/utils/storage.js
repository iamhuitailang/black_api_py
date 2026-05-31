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
        return this.get('doudizhu_token');
    },

    setToken(token) {
        this.set('doudizhu_token', token);
    },

    removeToken() {
        this.remove('doudizhu_token');
    },

    getUser() {
        return this.get('doudizhu_user');
    },

    setUser(user) {
        this.set('doudizhu_user', user);
    },

    removeUser() {
        this.remove('doudizhu_user');
    }
};
