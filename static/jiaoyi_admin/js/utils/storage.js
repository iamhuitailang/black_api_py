const Storage = {
    prefix: 'jiaoyi_admin_',

    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    },

    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    },

    getToken() {
        return this.get('token');
    },

    setToken(token) {
        this.set('token', token);
    },

    removeToken() {
        this.remove('token');
    },

    getUser() {
        return this.get('user');
    },

    setUser(user) {
        this.set('user', user);
    },

    removeUser() {
        this.remove('user');
    }
};
