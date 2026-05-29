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
        return this.get('huodong_user_token');
    },

    setToken(token) {
        this.set('huodong_user_token', token);
    },

    removeToken() {
        this.remove('huodong_user_token');
    },

    getUser() {
        return this.get('huodong_user');
    },

    setUser(user) {
        this.set('huodong_user', user);
    },

    removeUser() {
        this.remove('huodong_user');
    }
};
