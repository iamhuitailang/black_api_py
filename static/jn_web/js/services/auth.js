const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/jn/user/login', { phone, password });

        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(phone, password, nickname) {
        const result = await ApiService.post('/jn/user/register', { phone, password, nickname });

        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async logout() {
        try {
            await ApiService.post('/jn/user/logout');
        } catch (e) {
            console.log('Logout API call failed, but proceeding with local logout');
        }

        Storage.removeToken();
        Storage.removeUser();

        return { code: 0, msg: '退出成功', data: null };
    },

    async getCurrentUser() {
        const result = await ApiService.get('/jn/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        const result = await ApiService.post('/jn/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/jn/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUserInfo() {
        return Storage.getUser();
    },

    getToken() {
        return Storage.getToken();
    }
};

window.AuthService = AuthService;
