const Auth = {
    TOKEN_KEY: 'yp_token',
    USER_KEY: 'yp_user',
    GAME_STATE_KEY: 'yp_game_state',

    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    },

    getToken() {
        return Storage.get(this.TOKEN_KEY);
    },

    setToken(token) {
        return Storage.set(this.TOKEN_KEY, token);
    },

    removeToken() {
        return Storage.remove(this.TOKEN_KEY);
    },

    getUser() {
        return Storage.get(this.USER_KEY);
    },

    setUser(user) {
        return Storage.set(this.USER_KEY, user);
    },

    updateUser(data) {
        const user = this.getUser();
        if (user) {
            return this.setUser({ ...user, ...data });
        }
        return false;
    },

    removeUser() {
        return Storage.remove(this.USER_KEY);
    },

    getGameState() {
        return Storage.get(this.GAME_STATE_KEY);
    },

    setGameState(state) {
        return Storage.set(this.GAME_STATE_KEY, state);
    },

    async login(username, password) {
        const response = await YpAPI.user.login({ username, password });
        if (response.code === 0 && response.data) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
            if (response.data.game_state) {
                this.setGameState(response.data.game_state);
            }
        }
        return response;
    },

    async register(data) {
        const response = await YpAPI.user.register(data);
        if (response.code === 0 && response.data) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
            if (response.data.game_state) {
                this.setGameState(response.data.game_state);
            }
        }
        return response;
    },

    async logout() {
        try {
            await YpAPI.user.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        this.removeToken();
        this.removeUser();
        Storage.remove(this.GAME_STATE_KEY);
        return true;
    },

    async refreshUser() {
        const response = await YpAPI.user.profile();
        if (response.code === 0 && response.data) {
            this.setUser(response.data);
        }
        return response;
    }
};
