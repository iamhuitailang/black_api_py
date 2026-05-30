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
        return this.get('shiwu_user_token');
    },

    setToken(token) {
        this.set('shiwu_user_token', token);
    },

    removeToken() {
        this.remove('shiwu_user_token');
    },

    getUser() {
        return this.get('shiwu_user');
    },

    setUser(user) {
        this.set('shiwu_user', user);
    },

    removeUser() {
        this.remove('shiwu_user');
    },

    getAdminToken() {
        return this.get('shiwu_admin_token');
    },

    setAdminToken(token) {
        this.set('shiwu_admin_token', token);
    },

    removeAdminToken() {
        this.remove('shiwu_admin_token');
    },

    getAdmin() {
        return this.get('shiwu_admin');
    },

    setAdmin(admin) {
        this.set('shiwu_admin', admin);
    },

    removeAdmin() {
        this.remove('shiwu_admin');
    }
};

window.Storage = Storage;
