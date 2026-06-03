(function() {
const AuthService = {
    async register(username, password, nickname = '') {
        const result = await ApiService.post('/user/register', {
            username,
            password,
            nickname
        });

        if (result.code === 0) {
            HdStorage.setToken(result.data.token);
            HdStorage.setUser(result.data.user);
        }

        return result;
    },

    async login(username, password) {
        const result = await ApiService.post('/user/login', {
            username,
            password
        });

        if (result.code === 0) {
            HdStorage.setToken(result.data.token);
            HdStorage.setUser(result.data.user);
        }

        return result;
    },

    async logout() {
        const token = HdStorage.getToken();
        if (token) {
            try {
                await ApiService.post('/user/logout');
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        HdStorage.removeToken();
        HdStorage.removeUser();
        HdStorage.removeGameState();
    },

    isLoggedIn() {
        return !!HdStorage.getToken();
    },

    getCurrentUser() {
        return HdStorage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/user/current/get');
        if (result.code === 0 && result.data) {
            HdStorage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        const result = await ApiService.post('/user/profile/update', data);
        if (result.code === 0 && result.data) {
            HdStorage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    }
};

window.AuthService = AuthService;
})();
