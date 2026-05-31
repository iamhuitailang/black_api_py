const ZbtAuth = {
    async login(username, password) {
        const result = await ZbtApi.post('/zbt/user/login', { username, password });
        if (result.code === 0) {
            ZbtStorage.setToken(result.data.token);
            ZbtStorage.setUser(result.data.user);
        }
        return result;
    },

    async register(username, password, nickname) {
        const result = await ZbtApi.post('/zbt/user/register', { username, password, nickname });
        if (result.code === 0) {
            ZbtStorage.setToken(result.data.token);
            ZbtStorage.setUser(result.data.user);
        }
        return result;
    },

    async logout() {
        try {
            await ZbtApi.post('/zbt/user/logout');
        } catch (e) {
            console.error('Logout error:', e);
        }
        ZbtStorage.removeToken();
        ZbtStorage.removeUser();
    },

    isLoggedIn() {
        return !!ZbtStorage.getToken();
    },

    getCurrentUser() {
        return ZbtStorage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ZbtApi.get('/zbt/user/current/get');
        if (result.code === 0 && result.data) {
            ZbtStorage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ZbtApi.post('/zbt/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ZbtApi.post('/zbt/user/profile/update', data);
        if (result.code === 0 && result.data) {
            ZbtStorage.setUser(result.data);
        }
        return result;
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 1;
    }
};
