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
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            localStorage.setItem(key, value);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getUser() {
        return this.get('danzhu_user');
    },

    setUser(user) {
        this.set('danzhu_user', user);
    },

    removeUser() {
        this.remove('danzhu_user');
    },

    getToken() {
        return this.get('danzhu_token');
    },

    setToken(token) {
        this.set('danzhu_token', token);
    },

    removeToken() {
        this.remove('danzhu_token');
    },

    getAdmin() {
        return this.get('danzhu_admin');
    },

    setAdmin(admin) {
        this.set('danzhu_admin', admin);
    },

    removeAdmin() {
        this.remove('danzhu_admin');
    },

    getAdminToken() {
        return this.get('danzhu_admin_token');
    },

    setAdminToken(token) {
        this.set('danzhu_admin_token', token);
    },

    removeAdminToken() {
        this.remove('danzhu_admin_token');
    }
};
