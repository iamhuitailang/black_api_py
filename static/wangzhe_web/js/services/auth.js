const AuthService = {
    isLoggedIn() {
        const token = Storage.get('wangzhe_token');
        const user = Storage.get('wangzhe_user');
        return !!(token && user);
    },

    isAdmin() {
        const adminToken = Storage.get('wangzhe_admin_token');
        const admin = Storage.get('wangzhe_admin');
        return !!(adminToken && admin);
    },

    getCurrentUser() {
        return Storage.get('wangzhe_user');
    },

    getCurrentAdmin() {
        return Storage.get('wangzhe_admin');
    },

    getToken() {
        return Storage.get('wangzhe_token');
    },

    getAdminToken() {
        return Storage.get('wangzhe_admin_token');
    },

    async login(username, password) {
        const result = await ApiService.user.login({ username, password });
        if (result.code === 0 && result.data) {
            Storage.set('wangzhe_token', result.data.token);
            Storage.set('wangzhe_user', result.data.user);
        }
        return result;
    },

    async adminLogin(username, password) {
        const result = await ApiService.admin.login({ username, password });
        if (result.code === 0 && result.data) {
            Storage.set('wangzhe_admin_token', result.data.token);
            Storage.set('wangzhe_admin', result.data.admin);
        }
        return result;
    },

    async register(username, password, nickname) {
        return await ApiService.user.register({ username, password, nickname });
    },

    async logout() {
        try {
            await ApiService.user.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        Storage.remove('wangzhe_token');
        Storage.remove('wangzhe_user');
    },

    async adminLogout() {
        try {
            await ApiService.admin.logout();
        } catch (e) {
            console.error('Admin logout error:', e);
        }
        Storage.remove('wangzhe_admin_token');
        Storage.remove('wangzhe_admin');
    },

    updateUser(userData) {
        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, ...userData };
        Storage.set('wangzhe_user', updatedUser);
        return updatedUser;
    },

    async fetchCurrentUser() {
        const result = await ApiService.user.getCurrent();
        if (result.code === 0 && result.data) {
            Storage.set('wangzhe_user', result.data);
            return result.data;
        }
        return null;
    },

    async fetchCurrentAdmin() {
        const result = await ApiService.admin.getCurrent();
        if (result.code === 0 && result.data) {
            Storage.set('wangzhe_admin', result.data.admin);
            return result.data.admin;
        }
        return null;
    },

    async refreshUser() {
        return await this.fetchCurrentUser();
    }
};

window.AuthService = AuthService;
