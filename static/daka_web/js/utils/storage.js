const Storage = {
    TOKEN_KEY: 'daka_token',
    USER_KEY: 'daka_user',

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || '';
    },

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};

window.Storage = Storage;
