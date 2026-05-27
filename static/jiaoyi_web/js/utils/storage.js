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
        return this.get('jiaoyi_user_token');
    },

    setToken(token) {
        this.set('jiaoyi_user_token', token);
    },

    removeToken() {
        this.remove('jiaoyi_user_token');
    },

    getUser() {
        return this.get('jiaoyi_user');
    },

    setUser(user) {
        this.set('jiaoyi_user', user);
    },

    removeUser() {
        this.remove('jiaoyi_user');
    },

    getAdminToken() {
        return this.get('jiaoyi_admin_token');
    },

    setAdminToken(token) {
        this.set('jiaoyi_admin_token', token);
    },

    removeAdminToken() {
        this.remove('jiaoyi_admin_token');
    },

    getAdmin() {
        return this.get('jiaoyi_admin');
    },

    setAdmin(admin) {
        this.set('jiaoyi_admin', admin);
    },

    removeAdmin() {
        this.remove('jiaoyi_admin');
    }
};

window.Storage = Storage;
