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

    getUserToken() {
        return this.get('fuwu_user_token');
    },

    setUserToken(token) {
        this.set('fuwu_user_token', token);
    },

    removeUserToken() {
        this.remove('fuwu_user_token');
    },

    getAdminToken() {
        return this.get('fuwu_admin_token');
    },

    setAdminToken(token) {
        this.set('fuwu_admin_token', token);
    },

    removeAdminToken() {
        this.remove('fuwu_admin_token');
    },

    getUser() {
        return this.get('fuwu_user');
    },

    setUser(user) {
        this.set('fuwu_user', user);
    },

    removeUser() {
        this.remove('fuwu_user');
    },

    getAdmin() {
        return this.get('fuwu_admin');
    },

    setAdmin(admin) {
        this.set('fuwu_admin', admin);
    },

    removeAdmin() {
        this.remove('fuwu_admin');
    },

    getRole() {
        return this.get('fuwu_role');
    },

    setRole(role) {
        this.set('fuwu_role', role);
    },

    removeRole() {
        this.remove('fuwu_role');
    }
};
