const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/chongwu09/user/login', { phone, password });
        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },
    async register(phone, password, nickname) {
        const result = await ApiService.post('/chongwu09/user/register', { phone, password, nickname });
        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },
    async logout() {
        try { await ApiService.post('/chongwu09/user/logout'); } catch (e) {}
        Storage.removeToken(); Storage.removeUser();
    },
    isLoggedIn() { return !!Storage.getToken(); },
    getCurrentUser() { return Storage.getUser(); },
    async getCurrentUserInfo() {
        const result = await ApiService.get('/chongwu09/user/current/get');
        if (result.code === 0 && result.data) Storage.setUser(result.data);
        return result;
    },
    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/chongwu09/user/password/change', { old_password: oldPassword, new_password: newPassword });
    },
    async updateProfile(data) {
        const result = await ApiService.post('/chongwu09/user/profile/update', data);
        if (result.code === 0 && result.data) Storage.setUser(result.data);
        return result;
    },
    async adminLogin(username, password) {
        const result = await ApiService.post('/chongwu09/admin/login', { username, password });
        if (result.code === 0) {
            Storage.setAdminToken(result.data.token);
            Storage.setAdmin(result.data.admin);
        }
        return result;
    },
    async adminLogout() {
        try { await ApiService.post('/chongwu09/admin/logout'); } catch (e) {}
        Storage.removeAdminToken(); Storage.removeAdmin();
    },
    isAdminLoggedIn() { return !!Storage.getAdminToken(); },
    getCurrentAdmin() { return Storage.getAdmin(); },
    async getAdminInfo() {
        const result = await ApiService.get('/chongwu09/admin/current/get');
        if (result.code === 0 && result.data) Storage.setAdmin(result.data);
        return result;
    },
    async adminChangePassword(oldPassword, newPassword) {
        return await ApiService.post('/chongwu09/admin/password/change', { old_password: oldPassword, new_password: newPassword });
    },
    async adminUpdateProfile(data) {
        const result = await ApiService.post('/chongwu09/admin/profile/update', data);
        if (result.code === 0 && result.data) Storage.setAdmin(result.data);
        return result;
    }
};
