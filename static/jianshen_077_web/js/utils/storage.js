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
        return this.get('jianshen_077_token');
    },

    setToken(token) {
        this.set('jianshen_077_token', token);
    },

    removeToken() {
        this.remove('jianshen_077_token');
    },

    getUser() {
        return this.get('jianshen_077_user');
    },

    setUser(user) {
        this.set('jianshen_077_user', user);
    },

    removeUser() {
        this.remove('jianshen_077_user');
    }
};

window.Storage = Storage;
