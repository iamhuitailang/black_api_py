const Storage = {
    TOKEN_KEY: 'xuanke_token',
    USER_KEY: 'xuanke_user',

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};
