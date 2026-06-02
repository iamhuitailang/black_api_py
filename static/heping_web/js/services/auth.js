const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/heping/user/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname) {
        const result = await ApiService.post('/heping/user/register', {
            username,
            password,
            nickname
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async logout() {
        const token = Storage.getToken();
        if (token) {
            try {
                await ApiService.post('/heping/user/logout');
            } catch (e) {
            }
        }
        Storage.removeToken();
        Storage.removeUser();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/heping/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/heping/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/heping/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async adminLogin(username, password) {
        const result = await ApiService.post('/heping/admin/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setAdminToken(result.data.token);
        }

        return result;
    },

    async adminLogout() {
        const token = Storage.getAdminToken();
        if (token) {
            try {
                const oldToken = Storage.getToken();
                Storage.setToken(Storage.getAdminToken());
                await ApiService.post('/heping/admin/logout');
                if (oldToken) {
                    Storage.setToken(oldToken);
                }
            } catch (e) {
            }
        }
        Storage.removeAdminToken();
    },

    isAdminLoggedIn() {
        return !!Storage.getAdminToken();
    },

    async getCurrentAdminInfo() {
        const oldToken = Storage.getToken();
        Storage.setToken(Storage.getAdminToken());
        try {
            const result = await ApiService.get('/heping/admin/current/get');
            return result;
        } finally {
            if (oldToken) {
                Storage.setToken(oldToken);
            }
        }
    }
};
