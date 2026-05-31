const AuthService = {
    async register(username, password, nickname) {
        return await Api.post('/user/register', { username, password, nickname });
    },

    async login(username, password) {
        const result = await Api.post('/user/login', { username, password });
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async logout() {
        const result = await Api.post('/user/logout');
        Storage.removeToken();
        Storage.removeUser();
        return result;
    },

    async getCurrentUser() {
        return await Api.get('/user/current/get');
    },

    async updateProfile(data) {
        return await Api.post('/user/profile/update', data);
    },

    async changePassword(oldPassword, newPassword) {
        return await Api.post('/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getUser() {
        return Storage.getUser();
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.hash = '#/login';
            return false;
        }
        return true;
    }
};
