const AuthService = {
    async register(data) {
        return ApiService.post('/tutor/register', data);
    },

    async login(username, password) {
        const result = await ApiService.post('/tutor/login', { username, password });
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async logout() {
        try {
            await ApiService.post('/tutor/logout');
        } catch (e) {}
        Storage.removeToken();
        Storage.removeUser();
        Router.navigate('login');
    },

    async getCurrentUser() {
        const result = await ApiService.get('/tutor/profile/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        return ApiService.post('/tutor/profile/update', data);
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getUser() {
        return Storage.getUser();
    },

    getUserRole() {
        const user = Storage.getUser();
        return user && user.profile ? user.profile.role : null;
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            Router.navigate('login');
            return false;
        }
        return true;
    }
};
