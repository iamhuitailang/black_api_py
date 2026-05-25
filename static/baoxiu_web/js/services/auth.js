const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/baoxiu/auth/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(userData) {
        const result = await ApiService.post('/baoxiu/auth/register', userData);

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
                await ApiService.post('/baoxiu/auth/logout');
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        Storage.clear();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    getUserRole() {
        const user = Storage.getUser();
        return user ? user.role : null;
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/baoxiu/auth/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/baoxiu/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/baoxiu/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    }
};
