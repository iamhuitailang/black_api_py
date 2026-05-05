const AuthService = {
    isLoggedIn() {
        return !!Storage.getToken();
    },

    getUser() {
        return Storage.getUser();
    },

    async login(username, password) {
        const result = await ApiService.post('/bq/user/login', {
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
        const result = await ApiService.post('/bq/user/register', {
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
        const result = await ApiService.post('/bq/user/logout');
        Storage.removeToken();
        Storage.removeUser();
        return result;
    },

    async getCurrentUser() {
        return await ApiService.get('/bq/user/current/get');
    },

    async updateProfile(data) {
        const result = await ApiService.post('/bq/user/profile/update', data);
        if (result.code === 0) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        const result = await ApiService.post('/bq/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
        if (result.code === 0) {
            Storage.removeToken();
            Storage.removeUser();
        }
        return result;
    }
};

window.AuthService = AuthService;
