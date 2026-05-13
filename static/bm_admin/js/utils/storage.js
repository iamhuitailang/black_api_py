const Storage = {
    getToken() {
        return localStorage.getItem('bm_admin_token');
    },

    setToken(token) {
        localStorage.setItem('bm_admin_token', token);
    },

    removeToken() {
        localStorage.removeItem('bm_admin_token');
    },

    getUser() {
        const userStr = localStorage.getItem('bm_admin_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        localStorage.setItem('bm_admin_user', JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem('bm_admin_user');
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};
