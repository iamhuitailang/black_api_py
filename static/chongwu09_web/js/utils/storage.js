const Storage = {
    set(key, value) {
        if (typeof value === 'object') value = JSON.stringify(value);
        localStorage.setItem(key, value);
    },
    get(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try { return JSON.parse(value); } catch (e) { return value; }
    },
    remove(key) { localStorage.removeItem(key); },
    clear() { localStorage.clear(); },
    getToken() { return this.get('cw09_token'); },
    setToken(token) { this.set('cw09_token', token); },
    removeToken() { this.remove('cw09_token'); },
    getUser() { return this.get('cw09_user'); },
    setUser(user) { this.set('cw09_user', user); },
    removeUser() { this.remove('cw09_user'); },
    getAdminToken() { return this.get('cw09_admin_token'); },
    setAdminToken(token) { this.set('cw09_admin_token', token); },
    removeAdminToken() { this.remove('cw09_admin_token'); },
    getAdmin() { return this.get('cw09_admin'); },
    setAdmin(admin) { this.set('cw09_admin', admin); },
    removeAdmin() { this.remove('cw09_admin'); }
};
