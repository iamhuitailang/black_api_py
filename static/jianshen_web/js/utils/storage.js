const Storage = {
    TOKEN_KEY: 'jianshen_user_token',
    USER_KEY: 'jianshen_user_data',

    getToken() { return localStorage.getItem(this.TOKEN_KEY) || ''; },
    setToken(token) { localStorage.setItem(this.TOKEN_KEY, token); },
    removeToken() { localStorage.removeItem(this.TOKEN_KEY); },

    getUser() {
        try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); }
        catch (e) { return null; }
    },
    setUser(user) { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); },
    removeUser() { localStorage.removeItem(this.USER_KEY); },

    clear() { this.removeToken(); this.removeUser(); }
};
