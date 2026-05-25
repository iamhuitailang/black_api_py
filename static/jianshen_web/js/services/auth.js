const AuthService = {
    async login(username, password) {
        const res = await ApiService.post('/jianshen/user/login', { username, password });
        if (res.code === 0) {
            Storage.setToken(res.data.token);
            Storage.setUser(res.data.user);
        }
        return res;
    },
    async register(username, password, nickname, email) {
        return ApiService.post('/jianshen/user/register', { username, password, nickname, email });
    },
    async logout() {
        try { await ApiService.post('/jianshen/user/logout'); } catch (e) {}
        Storage.clear();
        window.location.hash = 'login';
    },
    isLoggedIn() { return !!Storage.getToken(); },
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.hash = 'login';
            return false;
        }
        return true;
    }
};
