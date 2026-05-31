const AuthService = {
    async login(username, password) {
        const result = await Api.post('/admin/login', { username, password });
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setAdmin(result.data.admin);
        }
        return result;
    },

    async logout() {
        const result = await Api.post('/admin/logout');
        Storage.removeToken();
        Storage.removeAdmin();
        return result;
    },

    async getCurrentAdmin() {
        return await Api.get('/admin/current/get');
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getAdmin() {
        return Storage.getAdmin();
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    },

    isSuperAdmin() {
        const admin = this.getAdmin();
        return admin && admin.role === 0;
    }
};
