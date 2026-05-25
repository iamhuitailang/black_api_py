const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/tucao/user/login', {
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
        return await ApiService.post('/tucao/user/register', {
            username,
            password,
            nickname
        });
    },

    async logout() {
        const token = Storage.getToken();
        if (token) {
            try {
                await ApiService.post('/tucao/user/logout');
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

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/tucao/user/change/password', {
            old_password: oldPassword,
            new_password: newPassword
        });
    }
};
