const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/ershoushu/user/login', { username, password });
        if (result.code === 0) { Storage.setToken(result.data.token); Storage.setUser(result.data.user); }
        return result;
    },
    async register(username, password, nickname, phone) {
        const result = await ApiService.post('/ershoushu/user/register', { username, password, nickname, phone });
        if (result.code === 0) { Storage.setToken(result.data.token); Storage.setUser(result.data.user); }
        return result;
    },
    async logout() {
        try { await ApiService.post('/ershoushu/user/logout'); } catch (e) {}
        Storage.removeToken(); Storage.removeUser();
    },
    isLoggedIn() { return !!Storage.getToken(); },
    getCurrentUser() { return Storage.getUser(); },
    async getCurrentUserInfo() {
        const result = await ApiService.get('/ershoushu/user/current/get');
        if (result.code === 0 && result.data) Storage.setUser(result.data);
        return result;
    },
    async updateProfile(data) {
        const result = await ApiService.post('/ershoushu/user/profile/update', data);
        if (result.code === 0 && result.data) Storage.setUser(result.data);
        return result;
    },
    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/ershoushu/user/password/change', { old_password: oldPassword, new_password: newPassword });
    },
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
};
