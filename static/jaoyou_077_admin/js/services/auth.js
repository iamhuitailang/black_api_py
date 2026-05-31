const AdminAuthService = {
    async login(username, password) {
        return await Api.post('/jaoyou/admin/login', { username, password });
    },

    async logout() {
        const result = await Api.post('/jaoyou/admin/logout');
        Storage.clear();
        return result;
    },

    async getCurrentAdmin() {
        return await Api.get('/jaoyou/admin/current/get');
    },

    isLoggedIn() {
        return !!Storage.getToken();
    }
};
