const Storage = {
    TOKEN_KEY: 'huoche_token',
    USER_KEY: 'huoche_user',
    GAME_STATE_KEY: 'huoche_game_state',

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
        return userStr ? JSON.parse(userStr) : null;
    },

    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    setGameState(state) {
        localStorage.setItem(this.GAME_STATE_KEY, JSON.stringify(state));
    },

    getGameState() {
        const stateStr = localStorage.getItem(this.GAME_STATE_KEY);
        return stateStr ? JSON.parse(stateStr) : null;
    },

    removeGameState() {
        localStorage.removeItem(this.GAME_STATE_KEY);
    },

    clearAll() {
        this.removeToken();
        this.removeUser();
        this.removeGameState();
    },

    isLoggedIn() {
        return !!this.getToken();
    }
};
