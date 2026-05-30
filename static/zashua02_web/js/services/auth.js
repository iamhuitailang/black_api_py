const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/zashua02/user/login', {
            username: username,
            password: password
        });

        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname) {
        return await ApiService.post('/zashua02/user/register', {
            username: username,
            password: password,
            nickname: nickname || ''
        });
    },

    async logout() {
        const token = Storage.getToken();
        if (token) {
            try {
                await ApiService.post('/zashua02/user/logout');
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
        return await ApiService.get('/zashua02/user/current/get');
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/zashua02/user/password/set', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        return await ApiService.post('/zashua02/user/update', data);
    }
};

window.AuthService = AuthService;
