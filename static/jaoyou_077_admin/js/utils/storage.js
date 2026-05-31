const Storage = {
    TOKEN_KEY: 'jaoyou_admin_token',
    USER_KEY: 'jaoyou_admin_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};
