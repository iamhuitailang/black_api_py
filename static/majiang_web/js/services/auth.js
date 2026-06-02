const AuthService = {
    isLoggedIn() {
        return !!api.getToken();
    },

    async login(username, password) {
        const result = await api.user.login({ username, password });
        if (result.code === 0 && result.data) {
            api.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async register(username, nickname, password) {
        const result = await api.user.register({ username, nickname, password });
        return result;
    },

    async logout() {
        await api.user.logout();
        api.clearToken();
        Storage.removeUser();
        Storage.removeGameState();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    updateUser(user) {
        Storage.setUser(user);
    }
};
