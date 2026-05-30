const Storage = {
    get(key) {
        try {
            const value = localStorage.getItem(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
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

    getToken() {
        return localStorage.getItem('bq_token');
    },

    setToken(token) {
        localStorage.setItem('bq_token', token);
    },

    removeToken() {
        localStorage.removeItem('bq_token');
    },

    getUser() {
        try {
            const value = localStorage.getItem('bq_user');
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('bq_user', JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem('bq_user');
    },

    getAdminToken() {
        return localStorage.getItem('bq_admin_token');
    },

    setAdminToken(token) {
        localStorage.setItem('bq_admin_token', token);
    },

    removeAdminToken() {
        localStorage.removeItem('bq_admin_token');
    },

    getAdmin() {
        try {
            const value = localStorage.getItem('bq_admin');
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    setAdmin(admin) {
        localStorage.setItem('bq_admin', JSON.stringify(admin));
    },

    removeAdmin() {
        localStorage.removeItem('bq_admin');
    },

    getSearchHistory() {
        return this.get('bq_search_history') || [];
    },

    setSearchHistory(history) {
        this.set('bq_search_history', history);
    },

    removeSearchHistory() {
        this.remove('bq_search_history');
    }
};
