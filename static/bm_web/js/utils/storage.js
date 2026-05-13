const Storage = {
    getToken() {
        return localStorage.getItem('bm_user_token');
    },

    setToken(token) {
        localStorage.setItem('bm_user_token', token);
    },

    removeToken() {
        localStorage.removeItem('bm_user_token');
    },

    getUser() {
        const userStr = localStorage.getItem('bm_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        localStorage.setItem('bm_user', JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem('bm_user');
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};
