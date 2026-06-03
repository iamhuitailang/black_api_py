const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/gq/user/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname = '') {
        const result = await ApiService.post('/gq/user/register', {
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
                await ApiService.post('/gq/user/logout');
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        Storage.removeToken();
        Storage.removeUser();
        Storage.removeGameState();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/gq/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/gq/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/gq/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    }
};
