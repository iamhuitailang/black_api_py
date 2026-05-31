const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/chengyu/user/login', { username, password });
        if (result.code === 0) {
            Storage.setToken(result.data.access_token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async register(username, password, nickname, email) {
        const result = await ApiService.post('/chengyu/user/register', { username, password, nickname: nickname || '', email: email || '' });
        return result;
    },

    async logout() {
        Storage.removeToken();
        Storage.removeUser();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async getProfile() {
        const result = await ApiService.get('/chengyu/user/me/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        const result = await ApiService.put('/chengyu/user/me/put', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/chengyu/user/change/password', {
            old_password: oldPassword,
            new_password: newPassword
        });
    }
};
