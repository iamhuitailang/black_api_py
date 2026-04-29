const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/xq/user/login', {
            phone,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(phone, password, nickname = '', community = '') {
        const result = await ApiService.post('/xq/user/register', {
            phone,
            password,
            nickname,
            community
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
                await ApiService.post('/xq/user/logout');
            } catch (e) {
                console.error('Logout error:', e);
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
        const result = await ApiService.get('/xq/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/xq/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/xq/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    }
};
