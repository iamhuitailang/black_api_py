const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/feipin/admin/login', { username, password });
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.admin);
        }
        return result;
    },

    async logout() {
        try {
            await ApiService.post('/feipin/admin/logout');
        } catch (e) {
        }
        Storage.removeToken();
        Storage.removeUser();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async checkAuth() {
        if (!this.isLoggedIn()) {
            return false;
        }
        try {
            const result = await ApiService.get('/feipin/admin/current/get');
            return result.code === 0;
        } catch (e) {
            Storage.removeToken();
            Storage.removeUser();
            return false;
        }
    }
};

window.AuthService = AuthService;
