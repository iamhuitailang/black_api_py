const AuthService = {
    async login(username, password) {
        const res = await ApiService.post('/jianshen/admin/login', { username, password });
        if (res.code === 0) {
            Storage.setToken(res.data.token);
            Storage.setUser(res.data.admin);
        }
        return res;
    },
    async logout() {
        try {
            await ApiService.post('/jianshen/admin/logout');
        } catch (e) {}
        Storage.clear();
        window.location.hash = 'login';
    },
    async getCurrent() {
        return ApiService.get('/jianshen/admin/current/get');
    },
    isLoggedIn() {
        return !!Storage.getToken();
    },
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.hash = 'login';
            return false;
        }
        return true;
    }
};
