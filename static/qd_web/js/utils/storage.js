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
        return this.get('qd_user_token');
    },

    setToken(token) {
        this.set('qd_user_token', token);
    },

    removeToken() {
        this.remove('qd_user_token');
    },

    getUser() {
        return this.get('qd_user');
    },

    setUser(user) {
        this.set('qd_user', user);
    },

    removeUser() {
        this.remove('qd_user');
    },

    getNotificationEnabled() {
        const value = this.get('qd_notification_enabled');
        return value !== null ? value : true;
    },

    setNotificationEnabled(enabled) {
        this.set('qd_notification_enabled', enabled);
    }
};
