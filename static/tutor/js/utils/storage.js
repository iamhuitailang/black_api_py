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
        return this.get('tutor_token');
    },

    setToken(token) {
        this.set('tutor_token', token);
    },

    removeToken() {
        this.remove('tutor_token');
    },

    getUser() {
        return this.get('tutor_user');
    },

    setUser(user) {
        this.set('tutor_user', user);
    },

    removeUser() {
        this.remove('tutor_user');
    }
};
